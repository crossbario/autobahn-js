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


let debug = function () {};

if ('AUTOBAHN_DEBUG' in global && AUTOBAHN_DEBUG && 'console' in global) {
   debug = function () {
      console.log.apply(console, arguments);
   }
}

let warn = console.warn.bind(console);

exports.debug = debug;
exports.warn = warn;
