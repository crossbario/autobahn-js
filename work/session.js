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
var websocket = require('./websocket.js');


function newid() {
   return Math.floor(Math.random() * 9007199254740992);
}


var Result = function (args, kwargs) {

   var self = this;

   self.args = args || [];
   self.kwargs = kwargs || {};
}


var Error = function (error, args, kwargs) {

   var self = this;

   self.error = error;
   self.args = args || [];
   self.kwargs = kwargs || {};
}


var Subscription = function (session, id) {

   var self = this;

   self._session = session;
   self.active = true;
   self.id = id;
};


Subscription.prototype.unsubscribe = function () {

   var self = this;
   return self._session._unsubscribe(self);
};


var Registration = function (session, id) {

   var self = this;

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
   CHALLENGE: 3,
   AUTHENTICATE: 4,
   GOODBYE: 5,
   HEARTBEAT: 6,
   ERROR: 7,
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

WAMP_FEATURES = {
   roles: {
      caller: {},
      callee: {},
      publisher: {},
      subscriber: {}
   }
};


var Session = function (socket, options) {

   var self = this;

   // the transport connection (WebSocket object)
   self._socket = socket;

   // the WAMP session ID
   self._session_id = null;

   // 
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
         var fn = r[1];
         var options = r[2];

         self._subscriptions[subscription] = fn;

         var sub = new Subscription(self, subscription);
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
      var subscription = msg[1];
      var publication = msg[2];
      var details = msg[3];


      if (subscription in self._subscriptions) {

         var fn = self._subscriptions[subscription];

         try {

            fn(msg[4][0]);

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
         var fn = r[1];
         var options = r[2];

         self._registrations[registration] = fn;

         var reg = new Registration(self, registration);
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

         d.resolve(result);

         delete self._call_reqs[request];

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
      var request = msg[1];
      var registration = msg[2];
      var details = msg[3];

      if (registration in self._registrations) {

         var fn = self._registrations[registration];

         try {

            var res = fn.apply(this, msg[4]);

            // construct YIELD message
            //
            var reply = [MSG_TYPE.YIELD, request];
            if (false) {
               //msg.push(options);
            } else {
               reply.push({});
            }
            reply.push([res]);

            // send WAMP message
            //
            self._send_wamp(reply);

         } catch (e) {
            console.log("Exception raised in procedure endpoint", e);
         }

      } else {
         self._protocol_violation("INVOCATION received for non-registered registration ID " + request);
      }
   };
   self._MESSAGE_MAP[MSG_TYPE.INVOCATION] = self._process_INVOCATION;


   self._socket.onmessage = function (evt) {

      var msg = JSON.parse(evt.data);
      var msg_type = msg[0];

      // WAMP session handshake not yet finished
      //
      if (!self._session_id) {

         // the first message must be WELCOME ..
         //
         if (msg_type === MSG_TYPE.WELCOME) {

            self._session_id = msg[1];
            if (self.onjoin) {
               self.onjoin(msg[2]);
            }

         } else {
            self._protocol_violation("received non-WELCOME message when session is not yet established");
         }

      // WAMP session handshake finished
      //
      } else {

         if (msg_type === MSG_TYPE.WELCOME) {

            self._protocol_violation("received WELCOME when session is already established");

         } else if (msg_type === MSG_TYPE.GOODBYE) {

            if (!self._goodbye_sent) {

               var msg = [MSG_TYPE.GOODBYE, "wamp.close.normal", {}];
               self._send_wamp(msg);
            }
            self._session_id = null;
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


   self._socket.onopen = function () {
      if (self.onconnect) {
         self.onconnect();
      }
   };


   self._socket.onclose = function (evt) {
      //console.log(evt.code, evt.reason);
      if (self.ondisconnect) {
         self.ondisconnect();
      }
   };

};


Session.prototype.disconnect = function () {

   var self = this;

   self._socket.close(1000);
};


Session.prototype.join = function (realm) {

   var self = this;

   if (self._session_id) {
      throw "session already established";
   }

   self._goodbye_sent = false;

   var msg = [MSG_TYPE.HELLO, realm, WAMP_FEATURES];
   self._send_wamp(msg);
};


Session.prototype.leave = function (reason, message) {

   var self = this;

   if (!self._session_id) {
      throw "no session currently established";
   }

   if (!reason) {
      reason = "wamp.close.normal";
   }

   var details = {};
   if (message) {
      details.message = message;
   }

   var msg = [MSG_TYPE.GOODBYE, reason, details];
   self._send_wamp(msg);
   self._goodbye_sent = true;
};


Session.prototype.call = function (procedure, pargs, kwargs, options) {
   var self = this;

   // create and remember new CALL request
   //
   var request = newid();
   var d = when.defer();
   self._call_reqs[request] = [d, options];

   // construct CALL message
   //
   var msg = [MSG_TYPE.CALL, request];
   if (options) {
      msg.push(options);
   } else {
      msg.push({});
   }
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
      d = when.defer();
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
   return this.xpublish(topic, [payload], {}, options);
};


Session.prototype.subscribe = function (handler, topic, options) {
   var self = this;

   // create an remember new SUBSCRIBE request
   //
   var request = newid();
   var d = when.defer();
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


Session.prototype.register = function (endpoint, procedure, options) {
   var self = this;

   // create an remember new REGISTER request
   //
   var request = newid();
   var d = when.defer();
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
   var d = when.defer();
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
   var d = when.defer();
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
exports.Result = Result;
exports.Error = Error;
exports.Subscription = Subscription;
exports.Registration = Registration;
exports.Publication = Publication;
