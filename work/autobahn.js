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
var peer = require('./peer.js');
var transport = require('./transport.js');


function connect (options) {

   var _peer = new peer.Peer(options);
   _peer.onconnect = function () {

   };

   _peer.onhangup = function () {

   };

}

function launch (config, onopen, onclose) {
   var self = this;
   var debug = config.debug;
}

exports.version = '?.?.?';

exports.WebSocket = websocket.WebSocket;

exports.Transport = transport.Transport;

exports.Session = session.Session;
exports.Result = session.Result;
exports.Error = session.Error;
exports.Subscription = session.Subscription;
exports.Registration = session.Registration;
exports.Publication = session.Publication;
