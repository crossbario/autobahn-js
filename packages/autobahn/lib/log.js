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


// use empty debug() function as default
let debug = function () {};

// log debug messages to console if AUTOBAHN_DEBUG is in globals or set as environment variable - works in browser and NodeJS
if ('console' in global) {
   if (('AUTOBAHN_DEBUG' in global && AUTOBAHN_DEBUG) || ('process' in global && process.env.AUTOBAHN_DEBUG)) {
      debug = function () {
         // console.log.apply(console, arguments);

         // If you want to send an arguments list you need to use call:
         // https://stackoverflow.com/a/41354496/884770
         console.log.call(console, JSON.stringify(arguments[0], null, '  '));
      }
   }
}

console.log('Sdfsdf');

// write debug messages to tracefile if AUTOBAHN_TRACE is set as environment variable - only works on NodeJS
if ('process' in global && process.env.AUTOBAHN_TRACE) {
   debug = function () {
      const fs = require("fs");
      fs.appendFileSync(process.env.AUTOBAHN_TRACE, JSON.stringify(arguments[0], null, '  ') + '\n\n');
   }
}

let warn = console.warn.bind(console);

exports.debug = debug;
exports.warn = warn;
