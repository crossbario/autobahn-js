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

      self._websocket = self._websocket_factory.create();

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

      self._session.onleave = function (reason, message) {
         self._session_close_reason = reason;
         self._session_close_message = message;
         self._websocket.close(1000);
      };

      self._websocket.onclose = function (e) {

         if (self._session) {
            self._session._id = null;
            self._session = null;

            if (self.onclose) {
               var close_details = {
                  reason: self._session_close_reason,
                  message: self._session_close_message,
                  transport: {
                     code: e.code,
                     reason: e.reason,
                     wasClean: e.wasClean
                  }
               };
               self.onclose(close_details);
            }
         }
         self._websocket = null;

         // automatic reconnection
         //
         self._retry_count += 1;
         if (self._retry && self._retry_count <= self._max_retries) {

            self._is_retrying = true;

            // jitter retry delay
            if (self._retry_delay_jitter) {
               self._retry_delay = util.rand_normal(self._retry_delay, self._retry_delay * self._retry_delay_jitter);
            }

            // cap the retry delay
            if (self._retry_delay > self._max_retry_delay) {
               self._retry_delay = self._max_retry_delay;
            }

            console.log("retrying in " + self._retry_delay + " ms");
            setTimeout(retry, self._options.retry_delay);

            // retry delay growth for next retry cycle
            if (self._retry_delay_growth) {
               self._retry_delay = self._retry_delay * self._retry_delay_growth;
            }

         } else {
            console.log("giving up");
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
