///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (c) Crossbar.io Technologies GmbH and contributors
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

// Polyfills for <= IE9
require('./polyfill.js');

var pjson = require('../package.json');

var when = require('when');
//var fn = require("when/function");

var msgpack = require('msgpack5');
var cbor = require('cbor');
var nacl = require('tweetnacl');

if ('AUTOBAHN_DEBUG' in global && AUTOBAHN_DEBUG) {
   // https://github.com/cujojs/when/blob/master/docs/api.md#whenmonitor
   require('when/monitor/console');
   if ('console' in global) {
      console.log("AutobahnJS debug enabled");
   }
}

var util = require('./util.js');
var log = require('./log.js');
var session = require('./session.js');
var connection = require('./connection.js');
var configure = require('./configure.js');
var serializer = require('./serializer.js');

var persona = require('./auth/persona.js');
var cra = require('./auth/cra.js');
var cryptosign = require('./auth/cryptosign.js');

exports.version = pjson.version;

exports.transports = configure.transports;

exports.Connection = connection.Connection;

exports.Session = session.Session;
exports.Invocation = session.Invocation;
exports.Event = session.Event;
exports.Result = session.Result;
exports.Error = session.Error;
exports.Subscription = session.Subscription;
exports.Registration = session.Registration;
exports.Publication = session.Publication;

exports.serializer = serializer;

exports.auth_persona = persona.auth;
exports.auth_cra = cra;
exports.auth_cryptosign = cryptosign;

exports.when = when;
exports.msgpack = msgpack;
exports.cbor = cbor;
exports.nacl = nacl;

exports.util = util;
exports.log = log;
