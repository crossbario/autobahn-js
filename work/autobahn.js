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
var longpoll = require('./longpoll.js');
var peer = require('./peer.js');
var connection = require('./connection.js');


function connect (options) {

   var _peer = new peer.Peer(options);
   _peer.onconnect = function () {

   };

   _peer.onhangup = function () {

   };

}

function launch (options, onopen, onclose) {
   var self = this;
   var debug = config.debug;
}

function test () {

   ab.launch(
      {
         url: {
            websocket: "ws://127.0.0.1:9000/ws",
            longpoll: "http://127.0.0.1/wamp",
         },
         realm: 'realm1'
      },
      function (session) {

      },
      function (code, reason, detail) {

      }
   );

   transport.onopen = function (session) {

   };

   transport.onretry = function (retry) {
      retry();
      next();
   }
}

exports.version = '?.?.?';

exports.WebSocket = websocket.WebSocket;

exports.Connection = connection.Connection;

exports.Session = session.Session;
exports.Result = session.Result;
exports.Error = session.Error;
exports.Subscription = session.Subscription;
exports.Registration = session.Registration;
exports.Publication = session.Publication;
exports.LongPoll = longpoll.LongPoll;
