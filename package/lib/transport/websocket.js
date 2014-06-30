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


var util = require('../util.js');


function Factory (options) {
   var self = this;

   self._options = options;

   util.assert(self._options.url !== undefined, "options.url missing");
   util.assert(typeof self._options.url === "string", "options.url must be a string");

   if (!self._options.protocols) {
      self._options.protocols = ['wamp.2.json'];
   } else {
      util.assert(self._options.protocols instanceof Array, "options.protocols must be an array");
   }
}


Factory.type = "websocket";


Factory.prototype.create = function () {

   var self = this;

   //
   // running in browser
   //
   if ('window' in global) {

      // Chrome, MSIE, newer Firefox
      if ("WebSocket" in window) {
         
         if (self._options.protocols) {
            return new window.WebSocket(self._options.url, self._options.protocols);
         } else {
            return new window.WebSocket(self._options.url);
         }

      // older versions of Firefox prefix the WebSocket object
      } else if ("MozWebSocket" in window) {

         if (self._options.protocols) {
            return new window.MozWebSocket(self._options.url, self._options.protocols);
         } else {
            return new window.MozWebSocket(self._options.url);
         }
      } else {
         return false;
      }

   //
   // running on NodeJS
   //
   } else {

      // our WebSocket shim with W3C API
      var websocket = {};

      // these will get defined by the specific shim
      websocket.protocol = undefined;
      websocket.send = undefined;
      websocket.close = undefined;

      // these will get called by the shim.
      // in case user code doesn't override these, provide these NOPs
      websocket.onmessage = function () {};
      websocket.onopen = function () {};
      websocket.onclose = function () {};
      websocket.onerror = function () {};

      var self = this;

      // https://github.com/einaros/ws
      //
      (function () {

         var WebSocket = require('ws');
         var client;
         var protocols;

         if (self._options.protocols) {
            protocols = self._options.protocols;
            if (Array.isArray(protocols)) {
               protocols = protocols.join(',');
            }
            client = new WebSocket(self._options.url, {protocol: protocols});
         } else {
            client = new WebSocket(self._options.url);
         }

         websocket.send = function (msg) {
            client.send(msg, {binary: false});
         };

         websocket.close = function (code, reason) {
            client.close();
         };

         client.on('open', function () {
            websocket.onopen();
         });

         client.on('message', function (data, flags) {
            if (flags.binary) {
               // FIXME!
            } else {
               websocket.onmessage({data: data});
            }
         });

         // FIXME: improve mapping to WS API for the following
         // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Close_codes
         //
         client.on('close', function (code, message) {
            var evt = {
               code: code,
               reason: message,
               wasClean: code === 1000
            }
            websocket.onclose(evt);
         });

         client.on('error', function (error) {
            var evt = {
               code: 1006,
               reason: '',
               wasClean: false
            }
            websocket.onclose(evt);
         });

      })();

      return websocket;
   }
};



exports.Factory = Factory;
