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

var autobahn = require('./../index.js');

exports.testConnect = function (testcase) {

   // fully qualified config
   var config = {
      transports: [
         {
            type: 'websocket',
            url: 'ws://127.0.0.1:8080/ws',
            protocols: ['wamp.2.json']
         }
      ],
      realm: 'realm1'
   }
/*
   // shortcut config
   var config = {
      url: 'ws://127.0.0.1:8080/ws',
      realm: 'realm1'
   }
*/
   var connection = new autobahn.Connection(config);

   connection.onopen = function (session) {
      console.log("connected", session.id);
   };

   connection.onclose = function (reason, details) {
      console.log("connection lost", reason, details);
   }

   connection.open();
}
