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

   util.assert(options.url !== undefined, "options.url missing");
   util.assert(typeof options.url === "string", "options.url must be a string");

   if (!options.protocols) {
      options.protocols = ['wamp.2.json'];
   } else {
      util.assert(Array.isArray(options.protocols), "options.protocols must be an array");
   }

   self._options = options;
}


Factory.prototype.type = "websocket";


Factory.prototype.create = function () {

   var self = this;

   // the WAMP transport we create
   var transport = {};

   // these will get defined further below
   transport.protocol = undefined;
   transport.send = undefined;
   transport.close = undefined;

   // these will get overridden by the WAMP session using this transport
   transport.onmessage = function () {};
   transport.onopen = function () {};
   transport.onclose = function () {};

   //
   // running in browser
   //
   if ('window' in global) {

      (function () {

         var websocket;

         // Chrome, MSIE, newer Firefox
         if ("WebSocket" in window) {
            
            if (self._options.protocols) {
               websocket = new window.WebSocket(self._options.url, self._options.protocols);
            } else {
               websocket = new window.WebSocket(self._options.url);
            }

         // older versions of Firefox prefix the WebSocket object
         } else if ("MozWebSocket" in window) {

            if (self._options.protocols) {
               websocket = new window.MozWebSocket(self._options.url, self._options.protocols);
            } else {
               websocket = new window.MozWebSocket(self._options.url);
            }
         } else {
            throw "browser does not support WebSocket";
         }

         websocket.onmessage = function (evt) {
            var msg = JSON.parse(evt.data);
            transport.onmessage(msg);
         }

         websocket.onopen = function () {
            transport.onopen();
         }

         websocket.onclose = function () {
            transport.onclose();
         }

         transport.send = function (msg) {
            var payload = JSON.stringify(msg);
            websocket.send(payload);
         }

      })();

   //
   // running on NodeJS
   //
   } else {

      (function () {

         var WebSocket = require('ws'); // https://github.com/einaros/ws
         var websocket;

         var protocols;
         if (self._options.protocols) {
            protocols = self._options.protocols;
            if (Array.isArray(protocols)) {
               protocols = protocols.join(',');
            }
            websocket = new WebSocket(self._options.url, {protocol: protocols});
         } else {
            websocket = new WebSocket(self._options.url);
         }

         transport.send = function (msg) {
            var payload = JSON.stringify(msg);
            websocket.send(payload, {binary: false});
         };

         transport.close = function (code, reason) {
            websocket.close();
         };

         websocket.on('open', function () {
            transport.onopen();
         });

         websocket.on('message', function (data, flags) {
            if (flags.binary) {
               // FIXME!
            } else {
               var msg = JSON.parse(data);
               transport.onmessage(msg);
            }
         });

         // FIXME: improve mapping to WS API for the following
         // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Close_codes
         //
         websocket.on('close', function (code, message) {
            var evt = {
               code: code,
               reason: message,
               wasClean: code === 1000
            }
            transport.onclose(evt);
         });

         websocket.on('error', function (error) {
            var evt = {
               code: 1006,
               reason: '',
               wasClean: false
            }
            transport.onclose(evt);
         });

      })();
   }

   return transport;
};



exports.Factory = Factory;
