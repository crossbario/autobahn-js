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

function connect () {

}

function launch (config, onopen, onclose) {

}

exports.WebSocket = websocket.WebSocket;

exports.Session = session.Session;

exports.Subscription = session.Subscription;
exports.Registration = session.Registration;
exports.Publication = session.Publication;
