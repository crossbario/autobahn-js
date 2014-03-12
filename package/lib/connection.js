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

var session = require('./session.js');
var websocket = require('./websocket.js');
var util = require('./util.js');
var log = require('./log.js');


var Connection = function (options) {

   var self = this;

   self._options = options;

   // WAMP transport
   //
   self._websocket_factory = new websocket.WebSocket(self._options.url, ['wamp.2.json']);
   self._websocket = null;

   // WAMP session
   //
   self._session = null;
   self._session_close_reason = null;
   self._session_close_message = null;

   // automatic reconnection configuration
   //

   // maximum number of reconnection attempts
   self._max_retries = self._options.max_retries || 15;

   // initial retry delay in seconds
   self._initial_retry_delay = self._options.initial_retry_delay || (1.5 * 1000);

   // maximum seconds between reconnection attempts
   self._max_retry_delay = self._options.max_retry_delay || (5 * 60 * 1000);

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
};


Connection.prototype.open = function () {

   var self = this;

   if (self._websocket || self._is_retrying) {
      throw "connection already open (or opening or retrying)";
   }

   self._retry = true;
   self._retry_count = 0;

   function retry () {

      // let the WebSocket factory produce a new WebSocket connection
      // which will automatically connect
      self._websocket = self._websocket_factory.create();
      if (!self._websocket) {
         self._retry = false;
         if (self.onclose) {
            self.onclose("unsupported", "WebSocket transport unsupported");
         }
         return;
      }

      // create a new WAMP session using the WebSocket connection as transport
      self._session = new session.Session(self._websocket, self._options);
      self._session_close_reason = null;
      self._session_close_message = null;

      self._websocket.onopen = function () {

         self._is_retrying = false;
         self._retry_count = 0;
         self._retry_delay = self._initial_retry_delay;

         self._connect_successes += 1;

         self._session.join(self._options.realm, self._options.authmethods);
      };

      self._session.onjoin = function (details) {
         if (self.onopen) {
            self.onopen(self._session, details);
         }
      };

      //
      // ... WAMP session is now attached to realm.
      //

      self._session.onleave = function (reason, details) {
         self._session_close_reason = reason;
         self._session_close_message = details.message;
         self._retry = false;
         self._websocket.close(1000);
      };

      self._websocket.onclose = function (evt) {

         self._websocket = null;

         var reason = null;
         if (self._connect_successes === 0) {
            reason = "unreachable";
            self._retry = false;

         } else if (!evt.wasClean) {
            reason = "lost";

         } else {
            reason = "closed";
         }

         var stop_retrying = false;

         if (self.onclose) {
            var details = {
               reason: self._session_close_reason,
               message: self._session_close_message
            };
            stop_retrying = self.onclose(reason, details);
         }

         if (self._session) {
            self._session._id = null;
            self._session = null;
            self._session_close_reason = null;
            self._session_close_message = null;
         }

         // automatic reconnection
         //
         if (self._retry && !stop_retrying) {
            self._retry_count += 1;
            if (self._retry_count <= self._max_retries) {

               self._is_retrying = true;

               // jitter retry delay
               if (self._retry_delay_jitter) {
                  self._retry_delay = util.rand_normal(self._retry_delay, self._retry_delay * self._retry_delay_jitter);
               }

               // cap the retry delay
               if (self._retry_delay > self._max_retry_delay) {
                  self._retry_delay = self._max_retry_delay;
               }

               log.debug("retrying in " + self._retry_delay + " ms");
               setTimeout(retry, self._options.retry_delay);

               // retry delay growth for next retry cycle
               if (self._retry_delay_growth) {
                  self._retry_delay = self._retry_delay * self._retry_delay_growth;
               }

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

   if (!self._websocket && !self._is_retrying) {
      throw "connection already closed";
   }

   self._retry = false;

   if (self._session && self._session.isOpen) {
      self._session.leave(reason, message);
   } else if (self._websocket) {
      self._websocket.close(1000);
   }
};


Object.defineProperty(Connection.prototype, "session", {
   get: function () {
      return this._session;
   }
});


Object.defineProperty(Connection.prototype, "isOpen", {
   get: function () {
      return this._is_open;
   }
});


exports.Connection = Connection;
