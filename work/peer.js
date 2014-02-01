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


var Peer = function (options, onconnect, onhangup) {

   var self = this;

   self.options = options;
   self.onconnect = onconnect;
   self.onhangup = onhangup;

   self.connects = 0; // total number of successful connects
   self.retryCount = 0; // number of retries since last successful connect
};

/*var transport = autobahn.WebSocket(false, 'ws://127.0.0.1:9000/', ['wamp.2.json']);

session.connect(transport);



Peer.prototype.connect = function () {

   var self = this;
   return self._session._unsubscribe(self);
};
*/
exports.Peer = Peer;
