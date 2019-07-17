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


var debug = function () {};

if ('AUTOBAHN_DEBUG' in global && AUTOBAHN_DEBUG && 'console' in global) {
   debug = function () {
      console.log.apply(console, arguments);
   }
}

var warn = console.warn;

exports.debug = debug;
exports.warn = warn;
