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
   self._session = null;
   self._is_open = false;
};


Connection.prototype.open = function () {

   var self = this;

   self._retry = true;
   self._retry_count = 0;

   function retry () {

      self._websocket = self._websocket_factory.create();
      self._session = new session.Session(self._websocket, self._options);

      self._websocket.onopen = function () {
         self._session.join(self._options.realm);
      };

      self._session.onjoin = function (details) {
         self._is_open = true;
         if (self.onopen) {
            self.onopen(self._session, details);
         }
      };

      // session is open.

      self._session.onleave = function () {
         self._session = null;
         self._is_open = false;
         if (self.onclose) {
            self.onclose();
         }

         self._websocket.close(1000);
      };

      self._websocket.onclose = function () {
         if (self._session) {
            self._session = null;
            self._is_open = false;
            if (self.onclose) {
               self.onclose();
            }
         }
         self._websocket = null;

         self._retry_count += 1;
         if (self._retry && self._retry_count < self._options.max_retries) {
            setTimeout(retry, self._options.retry_delay);
         }
      }
   }

   retry();
};


Connection.prototype.close = function () {
   var self = this;
   self._retry = false;
   self._websocket.close();
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
