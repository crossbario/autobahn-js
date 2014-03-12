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


var Connection = function (options) {

   var self = this;

   self._options = options;

   self._websocket_factory = new websocket.WebSocket(self._options.url, ['wamp.2.json']);
   self._websocket = null;
   self._retry = false;
   self._retry_count = 0;
   self._is_retrying = false;

   self._session = null;
   self._session_close_reason = null;
   self._session_close_message = null;
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

         self._retry_count += 1;
         if (self._retry && self._retry_count < self._options.max_retries) {
            self._is_retrying = true;
            setTimeout(retry, self._options.retry_delay);
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
