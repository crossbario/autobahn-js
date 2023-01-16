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

let warn = console.warn.bind(console);

exports.debug = debug;
exports.warn = warn;
