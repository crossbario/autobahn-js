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


var Transport = function () {

   var self = this;

   self._transports = [];
};


Transport.prototype.add = function (transport, options) {
   var self = this;

   self._transports.push({transport: transport, options: options});
};


exports.Transport = Transport;


/*
function main (session) {

   session.call('com.myapp.time').then(...)

   session.publish('com.myapp.topic1', [1, 2, 'hello'], null, {acknowledge: true});

   session.publish({topic: 'com.myapp.topic1', acknowledge: true}, 'hello');
   session.publish({topic: 'com.myapp.topic1', acknowledge: true}, [1, 2, 'hello']);

   session.publish('com.myapp.topic1', {acknowledge: true}, [1, 2, 'hello']);
}

var transport = autobahn.FallbackTransport({appname: 'com.myapp.ultimate'});

transport.add(new autobahn.WebSocket(false, 'ws://127.0.0.1:9000/', ['wamp.2.json']), {retries: 5});
transport.add(new autobahn.LongPoll(), {retries: 3});
transport.add(new autobahn.Alert({redirect: 'http://fallback.com/myapp'});

transport.onopen = function (session) {
   main(session);
};

transport.onretry = function (retry) {
   next();
};

transport.onclose = function (why) {

};

transport.open({username: 'joe'});

transport.next();

transport.close();
*/