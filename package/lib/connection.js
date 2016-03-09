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

var session = require('./session.js');
var util = require('./util.js');
var log = require('./log.js');
var autobahn = require('./autobahn.js');


var Connection = function (options) {

   var self = this;

   self._options = options;


   // Deferred factory
   //
   if (options && options.use_es6_promises) {

      if ('Promise' in global) {
         // ES6-based deferred factory
         //
         self._defer = function () {
            var deferred = {};

            deferred.promise = new Promise(function (resolve, reject) {
               deferred.resolve = resolve;
               deferred.reject = reject;
            });

            return deferred;
         };
      } else {

         log.debug("Warning: ES6 promises requested, but not found! Falling back to whenjs.");

         // whenjs-based deferred factory
         //
         self._defer = when.defer;
      }

   } else if (options && options.use_deferred) {

      // use explicit deferred factory, e.g. jQuery.Deferred or Q.defer
      //
      self._defer = options.use_deferred;

   } else {

      // whenjs-based deferred factory
      //
      self._defer = when.defer;
   }


   // WAMP transport
   //
   // backward compatiblity
   if (!self._options.transports) {
      self._options.transports = [
         {
            type: 'websocket',
            url: self._options.url
         }
      ];
   }
   self._transport_factories = [];
   self._init_transport_factories();


   // WAMP session
   //
   self._session = null;
   self._session_close_reason = null;
   self._session_close_message = null;

   // automatic reconnection configuration
   //

   // enable automatic reconnect if host is unreachable
   if (self._options.retry_if_unreachable !== undefined) {
      self._retry_if_unreachable = self._options.retry_if_unreachable;
   } else {
      self._retry_if_unreachable = true;
   }

   // maximum number of reconnection attempts
   self._max_retries = typeof self._options.max_retries !== 'undefined' ?  self._options.max_retries : 15;

   // initial retry delay in seconds
   self._initial_retry_delay = self._options.initial_retry_delay || 1.5;

   // maximum seconds between reconnection attempts
   self._max_retry_delay = self._options.max_retry_delay || 300;

   // the growth factor applied to the retry delay on each retry cycle
   self._retry_delay_growth = self._options.retry_delay_growth || 1.5;

   // the SD of a Gaussian to jitter the delay on each retry cycle
   // as a fraction of the mean
   self._retry_delay_jitter = self._options.retry_delay_jitter || 0.1;

   // reconnection tracking
   //

   // total number of successful connections
   self._connect_successes = 0;

   // controls if we should try to reconnect
   self._retry = false;

   // current number of reconnect cycles we went through
   self._retry_count = 0;

   // the current retry delay
   self._retry_delay = self._initial_retry_delay;

   // flag indicating if we are currently in a reconnect cycle
   self._is_retrying = false;

   // when retrying, this is the timer object returned from window.setTimeout()
   self._retry_timer = null;
};



Connection.prototype._create_transport = function () {
   for (var i = 0; i < this._transport_factories.length; ++i) {
      var transport_factory = this._transport_factories[i];
      log.debug("trying to create WAMP transport of type: " + transport_factory.type);
      try {
         var transport = transport_factory.create();
         if (transport) {
            log.debug("using WAMP transport type: " + transport_factory.type);
            return transport;
         }
      } catch (e) {
         // ignore
         log.debug("could not create WAMP transport '" + transport_factory.type + "': " + e);
      }
   }

   // could not create any WAMP transport
   return null;
};



Connection.prototype._init_transport_factories = function () {
    // WAMP transport
    //
    var transports, transport_options, transport_factory, transport_factory_klass;

    util.assert(this._options.transports, "No transport.factory specified");
    transports = this._options.transports;
    //if(typeof transports === "object") {
    //    this._options.transports = [transports];
    //}
    for(var i = 0; i < this._options.transports.length; ++i) {
        // cascading transports until we find one which works
        transport_options =  this._options.transports[i];

        if (!transport_options.url) {
            // defaulting to options.url if none is provided
            transport_options.url = this._options.url;
        }
        if (!transport_options.serializers) {
            transport_options.serializers = this._options.serializers;
        }
        if (!transport_options.protocols) {
            transport_options.protocols = this._options.protocols;
        }
        util.assert(transport_options.type, "No transport.type specified");
        util.assert(typeof transport_options.type === "string", "transport.type must be a string");
        try {
            transport_factory_klass = autobahn.transports.get(transport_options.type);
            if (transport_factory_klass) {
                transport_factory = new transport_factory_klass(transport_options);
                this._transport_factories.push(transport_factory);
            }
        } catch (exc) {
            console.error(exc);
        }
    }
};


Connection.prototype._autoreconnect_reset_timer = function () {

   var self = this;

   if (self._retry_timer) {
      clearTimeout(self._retry_timer);
   }
   self._retry_timer = null;
}


Connection.prototype._autoreconnect_reset = function () {

   var self = this;

   self._autoreconnect_reset_timer();

   self._retry_count = 0;
   self._retry_delay = self._initial_retry_delay;
   self._is_retrying = false;
}


Connection.prototype._autoreconnect_advance = function () {

   var self = this;

   // jitter retry delay
   if (self._retry_delay_jitter) {
      self._retry_delay = util.rand_normal(self._retry_delay, self._retry_delay * self._retry_delay_jitter);
   }

   // cap the retry delay
   if (self._retry_delay > self._max_retry_delay) {
      self._retry_delay = self._max_retry_delay;
   }

   // count number of retries
   self._retry_count += 1;

   var res;
   if (self._retry && (self._max_retries === -1 || self._retry_count <= self._max_retries)) {
      res = {
         count: self._retry_count,
         delay: self._retry_delay,
         will_retry: true
      };
   } else {
      res = {
         count: null,
         delay: null,
         will_retry: false
      }
   }

   // retry delay growth for next retry cycle
   if (self._retry_delay_growth) {
      self._retry_delay = self._retry_delay * self._retry_delay_growth;
   }

   return res;
}


Connection.prototype.open = function () {

   var self = this;

   if (self._transport) {
      throw "connection already open (or opening)";
   }

   self._autoreconnect_reset();
   self._retry = true;

   function retry () {

      // create a WAMP transport
      self._transport = self._create_transport();

      if (!self._transport) {
         // failed to create a WAMP transport
         self._retry = false;
         if (self.onclose) {
            var details = {
               reason: null,
               message: null,
               retry_delay: null,
               retry_count: null,
               will_retry: false
            };
            self.onclose("unsupported", details);
         }
         return;
      }

      // create a new WAMP session using the WebSocket connection as transport
      self._session = new session.Session(self._transport, self._defer, self._options.onchallenge);
      self._session_close_reason = null;
      self._session_close_message = null;

      self._transport.onopen = function () {

         // reset auto-reconnect timer and tracking
         self._autoreconnect_reset();

         // log successful connections
         self._connect_successes += 1;

         // start WAMP session
         self._session.join(self._options.realm, self._options.authmethods, self._options.authid);
      };

      self._session.onjoin = function (details) {
         if (self.onopen) {
            try {
               self.onopen(self._session, details);
            } catch (e) {
               log.debug("Exception raised from app code while firing Connection.onopen()", e);
            }
         }
      };

      //
      // ... WAMP session is now attached to realm.
      //

      self._session.onleave = function (reason, details) {
         self._session_close_reason = reason;
         self._session_close_message = details.message || "";
         self._retry = false;
         self._transport.close(1000);
      };

      self._transport.onclose = function (evt) {

         // remove any pending reconnect timer
         self._autoreconnect_reset_timer();

         self._transport = null;

         var reason = null;
         if (self._connect_successes === 0) {
            reason = "unreachable";
            if (!self._retry_if_unreachable) {
               self._retry = false;
            }

         } else if (!evt.wasClean) {
            reason = "lost";

         } else {
            reason = "closed";
         }
        
         var next_retry = self._autoreconnect_advance();

         // fire app code handler
         //
         if (self.onclose) {
            var details = {
               reason: self._session_close_reason,
               message: self._session_close_message,
               retry_delay: next_retry.delay,
               retry_count: next_retry.count,
               will_retry: next_retry.will_retry
            };
            try {
               // Connection.onclose() allows to cancel any subsequent retry attempt
               var stop_retrying = self.onclose(reason, details);
            } catch (e) {
               log.debug("Exception raised from app code while firing Connection.onclose()", e);
            }
         }

         // reset session info
         //
         if (self._session) {
            self._session._id = null;
            self._session = null;
            self._session_close_reason = null;
            self._session_close_message = null;
         }

         // automatic reconnection
         //
         if (self._retry && !stop_retrying) {

            if (next_retry.will_retry) {

               self._is_retrying = true;

               log.debug("retrying in " + next_retry.delay + " s");
               self._retry_timer = setTimeout(retry, next_retry.delay * 1000);

            } else {
               log.debug("giving up trying to reconnect");
            }
         }
      }
   }

   retry();
};


Connection.prototype.close = function (reason, message) {
   var self = this;

   if (!self._transport && !self._is_retrying) {
      throw "connection already closed";
   }

   // the app wants to close .. don't retry
   self._retry = false;

   if (self._session && self._session.isOpen) {
      // if there is an open session, close that first.
      self._session.leave(reason, message);
   } else if (self._transport) {
      // no session active: just close the transport
      self._transport.close(1000);
   }
};



Object.defineProperty(Connection.prototype, "defer", {
   get: function () {
      return this._defer;
   }
});



Object.defineProperty(Connection.prototype, "session", {
   get: function () {
      return this._session;
   }
});



Object.defineProperty(Connection.prototype, "isOpen", {
   get: function () {
      if (this._session && this._session.isOpen) {
         return true;
      } else {
         return false;
      }
   }
});



Object.defineProperty(Connection.prototype, "isConnected", {
   get: function () {
      if (this._transport) {
         return true;
      } else {
         return false;
      }
   }
});



Object.defineProperty(Connection.prototype, "transport", {
   get: function () {
      if (this._transport) {
         return this._transport;
      } else {
         return {info: {type: 'none', url: null, protocol: null}};
      }
   }
});



Object.defineProperty(Connection.prototype, "isRetrying", {
   get: function () {
      return this._is_retrying;
   }
});



exports.Connection = Connection;
