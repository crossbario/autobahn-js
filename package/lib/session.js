///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (C) 2011-2014 Tavendo GmbH, http://tavendo.com
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////


var when = require('when');
var when_fn = require("when/function");

// workaround for crypto-js on IE11
// http://code.google.com/p/crypto-js/issues/detail?id=81
if ('window' in global) {
   if (!('Uint8ClampedArray' in window)) {
      window.Uint8ClampedArray = Uint8Array;
   }
}
var crypto = require('crypto-js');

var websocket = require('./websocket.js');


// WAMP "Advanced Profile" support in AutobahnJS:
//
WAMP_FEATURES = {
   roles: {
      caller: {
         features: {
            caller_identification: true,
            progressive_call_results: true
         }
      },
      callee: {
         features: {
            progressive_call_results: true
         }
      },
      publisher: {
         features: {
            subscriber_blackwhite_listing: true,
            publisher_exclusion: true,
            publisher_identification: true
         }
      },
      subscriber: {
         features: {
            publisher_identification: true
         }
      }
   }
};


// generate a WAMP ID
//
function newid () {
   return Math.floor(Math.random() * 9007199254740992);
}


// PBKDF2-base key derivation function for salted WAMP-CRA
//
function derive_key (secret, extra) {
   if (extra && extra.salt) {
      var salt = extra.salt;
      var keylen = extra.keylen || 32;
      var iterations = extra.iterations || 10000;
      var key = crypto.PBKDF2(secret,
                              salt,
                              {
                                 keySize: keylen / 4,
                                 iterations: iterations,
                                 hasher: CryptoJS.algo.SHA256
                              }
      );
      return key.toString(crypto.enc.Base64);
   } else {
      return secret;
   }
}


function auth_sign (challenge, secret) {
   if (!secret) {
      secret = "";
   }

   return crypto.HmacSHA256(challenge, secret).toString(crypto.enc.Base64);
}


var Invocation = function (caller, progress) {

   var self = this;

   self.caller = caller;
   self.progress = progress;
};


var Event = function (publication, publisher) {

   var self = this;

   self.publication = publication;
   self.publisher = publisher;
};


var Result = function (args, kwargs) {

   var self = this;

   self.args = args || [];
   self.kwargs = kwargs || {};
};


var Error = function (error, args, kwargs) {

   var self = this;

   self.error = error;
   self.args = args || [];
   self.kwargs = kwargs || {};
};


var Subscription = function (handler, session, id) {

   var self = this;

   self._handler = handler;
   self._session = session;
   self.active = true;
   self.id = id;
};


Subscription.prototype.unsubscribe = function () {

   var self = this;
   return self._session._unsubscribe(self);
};


var Registration = function (endpoint, session, id) {

   var self = this;

   self._endpoint = endpoint;
   self._session = session;
   self.active = true;
   self.id = id;
};


Registration.prototype.unregister = function () {

   var self = this;
   return self._session._unregister(self);
};


var Publication = function (id) {

   var self = this;
   self.id = id;
};


var MSG_TYPE = {
   HELLO: 1,
   WELCOME: 2,
   ABORT: 3,
   CHALLENGE: 4,
   AUTHENTICATE: 5,
   GOODBYE: 6,
   HEARTBEAT: 7,
   ERROR: 8,
   PUBLISH: 16,
   PUBLISHED: 17,
   SUBSCRIBE: 32,
   SUBSCRIBED: 33,
   UNSUBSCRIBE: 34,
   UNSUBSCRIBED: 35,
   EVENT: 36,
   CALL: 48,
   CANCEL: 49,
   RESULT: 50,
   REGISTER: 64,
   REGISTERED: 65,
   UNREGISTER: 66,
   UNREGISTERED: 67,
   INVOCATION: 68,
   INTERRUPT: 69,
   YIELD: 70
};



var Session = function (socket, options) {

   var self = this;

   // the transport connection (WebSocket object)
   self._socket = socket;

   // options
   self._options = options;

   // the WAMP session ID
   self.id = null;

   // the WAMP realm joined
   self.realm = null;

   // the WAMP features in use
   self._features = null;

   // closing state
   self._goodbye_sent = false;
   self._transport_is_closing = false;

   // outstanding requests;
   self._publish_reqs = {};
   self._subscribe_reqs = {};
   self._unsubscribe_reqs = {};
   self._call_reqs = {};
   self._register_reqs = {};
   self._unregister_reqs = {};

   // subscriptions in place;
   self._subscriptions = {};

   // registrations in place;
   self._registrations = {};

   // incoming invocations;
   self._invocations = {};


   // deferred factory
   if (options && options.use_es6_promises && ('Promise' in global)) {

      // ES6-based deferred factory
      //
      self.defer = function () {
         var deferred = {};

         deferred.promise = new Promise(function (resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
         });

         return deferred;
      };

   } else if (options && options.use_deferred) {

      // use explicit deferred factory, e.g. jQuery.Deferred or Q.defer
      //
      self.defer = options.use_deferred;

   } else {

      // whenjs-based deferred factory
      //
      self.defer = when.defer;
   }


   self._send_wamp = function (msg) {
      self._socket.send(JSON.stringify(msg));
   };


   self._protocol_violation = function (reason) {
      console.log("Protocol violation:", reason);
   };

   self._MESSAGE_MAP = {};
   self._MESSAGE_MAP[MSG_TYPE.ERROR] = {};


   self._process_SUBSCRIBED = function (msg) {
      //
      // process SUBSCRIBED reply to SUBSCRIBE
      //
      var request = msg[1];
      var subscription = msg[2];

      if (request in self._subscribe_reqs) {

         var r = self._subscribe_reqs[request];

         var d = r[0];
         var handler = r[1];
         var options = r[2];

         var sub = new Subscription(handler, self, subscription);

         self._subscriptions[subscription] = sub;

         d.resolve(sub);

         delete self._subscribe_reqs[request];

      } else {
         self._protocol_violation("SUBSCRIBED received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.SUBSCRIBED] = self._process_SUBSCRIBED;


   self._process_SUBSCRIBE_ERROR = function (msg) {
      //
      // process ERROR reply to SUBSCRIBE
      //
      var request = msg[2];
      var details = msg[3];
      var error = msg[4];

      // optional
      var args = msg[5];
      var kwargs = msg[6];

      if (request in self._subscribe_reqs) {

         var r = self._subscribe_reqs[request];

         var d = r[0];
         var fn = r[1];
         var options = r[2];

         d.reject(error);

         delete self._subscribe_reqs[request];

      } else {
         self._protocol_violation("SUBSCRIBE-ERROR received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.ERROR][MSG_TYPE.SUBSCRIBE] = self._process_SUBSCRIBE_ERROR;


   self._process_UNSUBSCRIBED = function (msg) {
      //
      // process UNSUBSCRIBED reply to UNSUBSCRIBE
      //
      var request = msg[1];

      if (request in self._unsubscribe_reqs) {

         var r = self._unsubscribe_reqs[request];

         var d = r[0];
         var subscription = r[1];

         if (subscription.id in self._subscriptions) {
            delete self._subscriptions[subscription.id];
         }

         subscription.active = false;
         d.resolve();

         delete self._unsubscribe_reqs[request];

      } else {
         self._protocol_violation("UNSUBSCRIBED received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.UNSUBSCRIBED] = self._process_UNSUBSCRIBED;


   self._process_UNSUBSCRIBE_ERROR = function (msg) {
      //
      // process ERROR reply to UNSUBSCRIBE
      //
      var request = msg[2];
      var details = msg[3];
      var error = msg[4];

      // optional
      var args = msg[5];
      var kwargs = msg[6];

      if (request in self._unsubscribe_reqs) {

         var r = self._unsubscribe_reqs[request];

         var d = r[0];
         var subscription = r[1];

         d.reject(error);

         delete self._unsubscribe_reqs[request];

      } else {
         self._protocol_violation("UNSUBSCRIBE-ERROR received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.ERROR][MSG_TYPE.UNSUBSCRIBE] = self._process_UNSUBSCRIBE_ERROR;


   self._process_PUBLISHED = function (msg) {
      //
      // process PUBLISHED reply to PUBLISH
      //
      var request = msg[1];
      var publication = msg[2];

      if (request in self._publish_reqs) {

         var r = self._publish_reqs[request];

         var d = r[0];
         var options = r[1];

         var pub = new Publication(publication);
         d.resolve(pub);

         delete self._publish_reqs[request];

      } else {
         self._protocol_violation("PUBLISHED received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.PUBLISHED] = self._process_PUBLISHED;


   self._process_PUBLISH_ERROR = function (msg) {
      //
      // process ERROR reply to PUBLISH
      //
      var request = msg[2];
      var details = msg[3];
      var error = msg[4];

      // optional
      var args = msg[5];
      var kwargs = msg[6];

      if (request in self._publish_reqs) {

         var r = self._publish_reqs[request];

         var d = r[0];
         var options = r[1];

         d.reject(error);

         delete self._publish_reqs[request];

      } else {
         self._protocol_violation("PUBLISH-ERROR received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.ERROR][MSG_TYPE.PUBLISH] = self._process_PUBLISH_ERROR;


   self._process_EVENT = function (msg) {
      //
      // process EVENT message
      //
      // [EVENT, SUBSCRIBED.Subscription|id, PUBLISHED.Publication|id, Details|dict, PUBLISH.Arguments|list, PUBLISH.ArgumentsKw|dict]

      var subscription = msg[1];

      if (subscription in self._subscriptions) {

         var handler = self._subscriptions[subscription]._handler;

         var publication = msg[2];
         var details = msg[3];

         var args = msg[4] || [];
         var kwargs = msg[5] || {};

         var ed = new Event(publication, details.publisher);

         try {
            handler(args, kwargs, ed);
         } catch (e) {
            console.log("Exception raised in event handler", e);
         }

      } else {
         self._protocol_violation("EVENT received for non-subscribed subscription ID " + subscription);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.EVENT] = self._process_EVENT;


   self._process_REGISTERED = function (msg) {
      //
      // process REGISTERED reply to REGISTER
      //
      var request = msg[1];
      var registration = msg[2];

      if (request in self._register_reqs) {

         var r = self._register_reqs[request];

         var d = r[0];
         var endpoint = r[1];
         var options = r[2];

         var reg = new Registration(endpoint, self, registration);

         self._registrations[registration] = reg;

         d.resolve(reg);

         delete self._register_reqs[request];

      } else {
         self._protocol_violation("REGISTERED received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.REGISTERED] = self._process_REGISTERED;


   self._process_REGISTER_ERROR = function (msg) {
      //
      // process ERROR reply to REGISTER
      //
      var request = msg[2];
      var details = msg[3];
      var error = msg[4];

      // optional
      var args = msg[5];
      var kwargs = msg[6];

      if (request in self._register_reqs) {

         var r = self._register_reqs[request];

         var d = r[0];
         var fn = r[1];
         var options = r[2];

         d.reject(error);

         delete self._register_reqs[request];

      } else {
         self._protocol_violation("REGISTER-ERROR received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.ERROR][MSG_TYPE.REGISTER] = self._process_REGISTER_ERROR;


   self._process_UNREGISTERED = function (msg) {
      //
      // process UNREGISTERED reply to UNREGISTER
      //
      var request = msg[1];

      if (request in self._unregister_reqs) {

         var r = self._unregister_reqs[request];

         var d = r[0];
         var registration = r[1];

         if (registration.id in self._registrations) {
            delete self._registrations[registration.id];
         }

         registration.active = false;
         d.resolve();

         delete self._unregister_reqs[request];

      } else {
         self._protocol_violation("UNREGISTERED received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.UNREGISTERED] = self._process_UNREGISTERED;


   self._process_UNREGISTER_ERROR = function (msg) {
      //
      // process ERROR reply to UNREGISTER
      //
      var request = msg[2];
      var details = msg[3];
      var error = msg[4];

      // optional
      var args = msg[5];
      var kwargs = msg[6];

      if (request in self._unregister_reqs) {

         var r = self._unregister_reqs[request];

         var d = r[0];
         var registration = r[1];

         d.reject(error);

         delete self._unregister_reqs[request];

      } else {
         self._protocol_violation("UNREGISTER-ERROR received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.ERROR][MSG_TYPE.UNREGISTER] = self._process_UNREGISTER_ERROR;


   self._process_RESULT = function (msg) {
      //
      // process RESULT reply to CALL
      //
      var request = msg[1];
      if (request in self._call_reqs) {

         var details = msg[2];

         var result = null;
         if (msg.length > 3) {
            if (msg.length > 4 || msg[3].length > 1) {
               // wrap complex result
               result = new Result(msg[3], msg[4]);
            } else {
               // single positional result
               result = msg[3][0];
            }
         }

         var r = self._call_reqs[request];

         var d = r[0];
         var options = r[1];

         if (details.progress) {
            if (options && options.receive_progress) {
               d.notify(result);
            }
         } else {
            d.resolve(result);
            delete self._call_reqs[request];
         }
      } else {
         self._protocol_violation("CALL-RESULT received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.RESULT] = self._process_RESULT;


   self._process_CALL_ERROR = function (msg) {
      //
      // process ERROR reply to CALL
      //
      var request = msg[2];
      if (request in self._call_reqs) {

         var details = msg[3];
         var error = new Error(msg[4], msg[5], msg[6]);

         var r = self._call_reqs[request];

         var d = r[0];
         var options = r[1];

         d.reject(error);

         delete self._call_reqs[request];

      } else {
         self._protocol_violation("CALL-ERROR received for non-pending request ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.ERROR][MSG_TYPE.CALL] = self._process_CALL_ERROR;


   self._process_INVOCATION = function (msg) {
      //
      // process INVOCATION message
      //
      // [INVOCATION, Request|id, REGISTERED.Registration|id, Details|dict, CALL.Arguments|list, CALL.ArgumentsKw|dict]
      //
      var request = msg[1];
      var registration = msg[2];

      var details = msg[3];
      // receive_progress
      // timeout
      // caller

      if (registration in self._registrations) {

         var endpoint = self._registrations[registration]._endpoint;

         var args = msg[4] || [];
         var kwargs = msg[5] || {};

         // create progress function for invocation
         //
         var progress = null;
         if (details.receive_progress) {

            progress = function (args, kwargs) {
               var progress_msg = [MSG_TYPE.YIELD, request, {progress: true}];

               args = args || [];
               kwargs = kwargs || {};

               var kwargs_len = Object.keys(kwargs).length;
               if (args.length || kwargs_len) {
                  progress_msg.push(args);
                  if (kwargs_len) {
                     progress_msg.push(kwargs);
                  }
               }
               self._send_wamp(progress_msg);
            }
         };

         var cd = new Invocation(details.caller, progress);

         // We use the following whenjs call wrapper, which automatically
         // wraps a plain, non-promise value in a (immediately resolved) promise
         //
         // See: https://github.com/cujojs/when/blob/master/docs/api.md#fncall
         //
         when_fn.call(endpoint, args, kwargs, cd).then(

            function (res) {
               // construct YIELD message
               // FIXME: Options
               //
               var reply = [MSG_TYPE.YIELD, request, {}];

               if (res instanceof Result) {
                  var kwargs_len = Object.keys(res.kwargs).length;
                  if (res.args.length || kwargs_len) {
                     reply.push(res.args);
                     if (kwargs_len) {
                        reply.push(res.kwargs);
                     }
                  }
               } else {
                  reply.push([res]);
               }

               // send WAMP message
               //
               self._send_wamp(reply);
            },

            function (err) {
               // construct ERROR message
               // [ERROR, REQUEST.Type|int, REQUEST.Request|id, Details|dict, Error|uri, Arguments|list, ArgumentsKw|dict]

               var reply = [MSG_TYPE.ERROR, MSG_TYPE.INVOCATION, request, {}];

               if (err instanceof Error) {

                  reply.push(err.error);

                  var kwargs_len = Object.keys(err.kwargs).length;
                  if (err.args.length || kwargs_len) {
                     reply.push(err.args);
                     if (kwargs_len) {
                        reply.push(err.kwargs);
                     }
                  }
               } else {
                  reply.push('wamp.error.runtime_error');
                  reply.push([err]);
               }

               // send WAMP message
               //
               self._send_wamp(reply);
            }
         );

      } else {
         self._protocol_violation("INVOCATION received for non-registered registration ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.INVOCATION] = self._process_INVOCATION;


   self._socket.onmessage = function (evt) {

      var msg = JSON.parse(evt.data);
      var msg_type = msg[0];

      // WAMP session not yet open
      //
      if (!self.id) {

         // the first message must be WELCOME, ABORT or CHALLENGE ..
         //
         if (msg_type === MSG_TYPE.WELCOME) {

            self.id = msg[1];

            // determine actual set of advanced features that can be used
            //
            var rf = msg[2];
            self._features = {};

            if (rf.roles.broker) {
               // "Basic Profile" is mandatory
               self._features.subscriber = {};
               self._features.publisher = {};

               // fill in features that both peers support
               if (rf.roles.broker.features) {

                  for (var att in WAMP_FEATURES.roles.publisher.features) {
                     self._features.publisher[att] = WAMP_FEATURES.roles.publisher.features[att] &&
                                                     rf.roles.broker.features[att];
                  }

                  for (var att in WAMP_FEATURES.roles.subscriber.features) {
                     self._features.subscriber[att] = WAMP_FEATURES.roles.subscriber.features[att] &&
                                                      rf.roles.broker.features[att];
                  }
               }
            }

            if (rf.roles.dealer) {
               // "Basic Profile" is mandatory
               self._features.caller = {};
               self._features.callee = {};

               // fill in features that both peers support
               if (rf.roles.dealer.features) {

                  for (var att in WAMP_FEATURES.roles.caller.features) {
                     self._features.caller[att] = WAMP_FEATURES.roles.caller.features[att] &&
                                                  rf.roles.dealer.features[att];
                  }

                  for (var att in WAMP_FEATURES.roles.callee.features) {
                     self._features.callee[att] = WAMP_FEATURES.roles.callee.features[att] &&
                                                  rf.roles.dealer.features[att];
                  }
               }
            }

            if (self.onjoin) {
               self.onjoin(msg[2]);
            }

         } else if (msg_type === MSG_TYPE.ABORT) {

            // FIXME
            console.log("Unhandled ABORT message", msg);

         } else if (msg_type === MSG_TYPE.CHALLENGE) {

            if (self._options.onchallenge) {

               var method = msg[1];
               var extra = msg[2];

               when_fn.call(self._options.onchallenge, self, method, extra).then(
                  function (signature) {
                     var msg = [MSG_TYPE.AUTHENTICATE, signature, {}];
                     self._send_wamp(msg);
                  },
                  function (err) {
                     console.log("onchallenge() raised:", err);
                  }
               );
            } else {
               console.log("received WAMP challenge, but no onchallenge() handler set");
            }

         } else {
            self._protocol_violation("unexpected message type " + msg_type);
         }

      // WAMP session is open
      //
      } else {

         if (msg_type === MSG_TYPE.GOODBYE) {

            if (!self._goodbye_sent) {

               var reply = [MSG_TYPE.GOODBYE, {}, "wamp.error.goodbye_and_out"];
               self._send_wamp(reply);
            }

            self.id = null;
            self.realm = null;
            self._features = null;

            if (self.onleave) {
               self.onleave();
            }

         } else {

            if (msg_type === MSG_TYPE.ERROR) {

               var request_type = msg[1];
               if (request_type in self._MESSAGE_MAP[MSG_TYPE.ERROR]) {

                  self._MESSAGE_MAP[msg_type][request_type](msg);

               } else {

                  self._protocol_violation("unexpected ERROR message with request_type " + request_type);
               }

            } else {

               if (msg_type in self._MESSAGE_MAP) {

                  self._MESSAGE_MAP[msg_type](msg);

               } else {

                  self._protocol_violation("unexpected message type " + msg_type);
               }
            }
         }
      }
   };
};


Object.defineProperty(Session.prototype, "isOpen", {
   get: function () {
      return this.id !== null;
   }
});


Object.defineProperty(Session.prototype, "features", {
   get: function () {
      return this._features;
   }
});


Object.defineProperty(Session.prototype, "subscriptions", {
   get: function () {
      var keys = Object.keys(this._subscriptions);
      var vals = [];
      for (var i = 0; i < keys.length; ++i) {
         vals.push(this._subscriptions[keys[i]]);
      }
      return vals;
   }
});


Object.defineProperty(Session.prototype, "registrations", {
   get: function () {
      var keys = Object.keys(this._registrations);
      var vals = [];
      for (var i = 0; i < keys.length; ++i) {
         vals.push(this._registrations[keys[i]]);
      }
      return vals;
   }
});


Session.prototype.join = function (realm) {

   var self = this;

   if (self.id) {
      throw "session already established";
   }

   self._goodbye_sent = false;
   self.realm = realm;

   var msg = [MSG_TYPE.HELLO, realm, WAMP_FEATURES];
   self._send_wamp(msg);
};


Session.prototype.leave = function (reason, message) {

   var self = this;

   if (!self.id) {
      throw "no session currently established";
   }

   if (!reason) {
      reason = "wamp.close.normal";
   }

   var details = {};
   if (message) {
      details.message = message;
   }

   var msg = [MSG_TYPE.GOODBYE, details, reason];
   self._send_wamp(msg);
   self._goodbye_sent = true;
};


Session.prototype.call = function (procedure, pargs, kwargs, options) {
   var self = this;

   // create and remember new CALL request
   //
   var request = newid();
   var d = self.defer();
   self._call_reqs[request] = [d, options];

   // construct CALL message
   //
   var msg = [MSG_TYPE.CALL, request];
   msg.push(options || {})
   msg.push(procedure);
   if (pargs) {
      msg.push(pargs);
      if (kwargs) {
         msg.push(kwargs);
      }
   }

   // send WAMP message
   //
   self._send_wamp(msg);

   return d.promise;
};


// old WAMP call
Session.prototype.call1 = function () {

   var self = this;
   var procedure = arguments[0];

   var pargs = [];
   for (var i = 1; i < arguments.length; i += 1) {
      pargs.push(arguments[i]);
   }

   return self.xcall(procedure, pargs);
};


Session.prototype.publish = function (topic, pargs, kwargs, options) {
   var self = this;

   var ack = options && options.acknowledge;
   var d = null;

   // create and remember new PUBLISH request
   //
   var request = newid();
   if (ack) {
      d = self.defer();
      self._publish_reqs[request] = [d, options];
   }

   // construct PUBLISH message
   //
   var msg = [MSG_TYPE.PUBLISH, request];
   if (options) {
      msg.push(options);
   } else {
      msg.push({});
   }
   msg.push(topic);
   if (pargs) {
      msg.push(pargs);
      if (kwargs) {
         msg.push(kwargs);
      }
   }

   // send WAMP message
   //
   self._send_wamp(msg);

   if (d) {
      return d.promise;
   }
};


// old WAMP publish
Session.prototype.publish1 = function (topic, payload, options) {
   return this.publish(topic, [payload], {}, options);
};


Session.prototype.subscribe = function (topic, handler, options) {
   var self = this;

   // create an remember new SUBSCRIBE request
   //
   var request = newid();
   var d = self.defer();
   self._subscribe_reqs[request] = [d, handler, options];

   // construct SUBSCRIBE message
   //
   var msg = [MSG_TYPE.SUBSCRIBE, request];
   if (options) {
      msg.push(options);
   } else {
      msg.push({});
   }
   msg.push(topic);

   // send WAMP message
   //
   self._send_wamp(msg);

   return d.promise;
};


Session.prototype.register = function (procedure, endpoint, options) {
   var self = this;

   // create an remember new REGISTER request
   //
   var request = newid();
   var d = self.defer();
   self._register_reqs[request] = [d, endpoint, options];

   // construct REGISTER message
   //
   var msg = [MSG_TYPE.REGISTER, request];
   if (options) {
      msg.push(options);
   } else {
      msg.push({});
   }
   msg.push(procedure);

   // send WAMP message
   //
   self._send_wamp(msg);

   return d.promise;
};


Session.prototype._unsubscribe = function (subscription) {
   var self = this;

   if (!subscription.active || !(subscription.id in self._subscriptions)) {
      throw "subscription not active";
   }

   // create and remember new UNSUBSCRIBE request
   //
   var request = newid();
   var d = self.defer();
   self._unsubscribe_reqs[request] = [d, subscription];

   // construct UNSUBSCRIBE message
   //
   var msg = [MSG_TYPE.UNSUBSCRIBE, request, subscription.id];

   // send WAMP message
   //
   self._send_wamp(msg);

   return d.promise;
};


Session.prototype._unregister = function (registration) {
   var self = this;

   if (!registration.active || !(registration.id in self._registrations)) {
      throw "registration not active";
   }

   // create and remember new UNREGISTER request
   //
   var request = newid();
   var d = self.defer();
   self._unregister_reqs[request] = [d, registration];

   // construct UNREGISTER message
   //
   var msg = [MSG_TYPE.UNREGISTER, request, registration.id];

   // send WAMP message
   //
   self._send_wamp(msg);

   return d.promise;
};


exports.Session = Session;

exports.Invocation = Invocation;
exports.Event = Event;
exports.Result = Result;
exports.Error = Error;
exports.Subscription = Subscription;
exports.Registration = Registration;
exports.Publication = Publication;
