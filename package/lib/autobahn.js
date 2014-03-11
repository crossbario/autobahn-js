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


var pjson = require('../package.json');

var when = require('when');
//var fn = require("when/function");

if ('DEBUG_AUTOBAHN' in global && DEBUG_AUTOBAHN) {
   // https://github.com/cujojs/when/blob/master/docs/api.md#whenmonitor
   require('when/monitor/console');
   if ('console' in global) {
      console.log("AutobahnJS debug enabled");
   }
}

var crypto = require('crypto-js');

var session = require('./session.js');
var websocket = require('./websocket.js');
var connection = require('./connection.js');
var persona = require('./persona.js');


exports.version = pjson.version;

exports.WebSocket = websocket.WebSocket;

exports.Connection = connection.Connection;

exports.Session = session.Session;
exports.Invocation = session.Invocation;
exports.Event = session.Event;
exports.Result = session.Result;
exports.Error = session.Error;
exports.Subscription = session.Subscription;
exports.Registration = session.Registration;
exports.Publication = session.Publication;

exports.auth_persona = persona.auth;

exports.when = when;
//exports.fn = fn;
exports.crypto = crypto;
