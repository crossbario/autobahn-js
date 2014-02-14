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
};


Connection.prototype.open = function () {

   var self = this;
   self._websocket = self._websocket_factory.create();

   var _session = new session.Session(self._websocket, self._options);

   _session.onconnect = function () {
      _session.join(self._options.realm);
   };

   _session.onjoin = function () {
      if (self.onopen) {
         self.onopen(_session);
      }
   };

   _session.onleave = function () {
      this.disconnect();
   };

   _session.ondisconnect = function () {
      if (self.onclose) {
         self.onclose();
      }
   };
};


Connection.prototype.close = function () {
   var self = this;
   self._websocket.close();
};


exports.Connection = Connection;
