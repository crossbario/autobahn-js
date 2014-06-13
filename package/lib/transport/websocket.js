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

function Factory(options) {
    this.options = options;
    util.assert(this.options.url!==undefined, "options.url missing");
    util.assert(typeof this.options.url === "string", "options.url must be a string");
}

Factory.type = "websocket";

Factory.prototype.create = function(protocols) {
    if ('window' in global) {

      //
      // running in browser
      //
      if ("WebSocket" in window) {
         // Chrome, MSIE, newer Firefox
         if (protocols) {
            return new window.WebSocket(this.options.url, protocols);
         } else {
            return new window.WebSocket(this.options.url);
         }
      } else if ("MozWebSocket" in window) {
         // older versions of Firefox prefix the WebSocket object

         if (protocols) {
            return new window.MozWebSocket(this.options.url, protocols);
         } else {
            return new window.MozWebSocket(this.options.url);
         }
      } else {
          return false;
      }

   } else {

      //
      // running on nodejs
      //

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

         if (protocols) {
            if (Array.isArray(protocols)) {
               protocols = protocols.join(',');
            }
            client = new WebSocket(self.options.url, {protocol: protocols});
         } else {
            client = new WebSocket(self.options.url);
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

            } else {
               websocket.onmessage({data: data});
            }
         });

         client.on('close', function () {
         });

         client.on('error', function () {
         });

      })();

      return websocket;
   }
};



exports.Factory = Factory;
