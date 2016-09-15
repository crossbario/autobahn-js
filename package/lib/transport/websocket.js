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
var log = require('../log.js');


function Factory (options) {
   var self = this;

   util.assert(options.url !== undefined, "options.url missing");
   util.assert(typeof options.url === "string", "options.url must be a string");

   if (!options.protocols) {
      options.protocols = ['wamp.2.json'];
   } else {
      util.assert(Array.isArray(options.protocols), "options.protocols must be an array");
   }

   if (!options.ping_timeout) {
      options.ping_timeout = 15000;
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
   transport.ontimeout = function() {};

   transport.info = {
      type: 'websocket',
      url: null,
      protocol: 'wamp.2.json'
   };


   // Test below used to be via the 'window' object in the browser.
   // This fails when running in a Web worker.
   //
   // running in Node.js
   //
   if (global.process && global.process.versions.node) {

      (function () {

         var WebSocket = require('ws'); // https://github.com/websockets/ws
         var websocket;

         var protocols;
         var wsOptions = {};
         
         if (self._options.protocols) {
            protocols = self._options.protocols;
            if (Array.isArray(protocols)) {
               protocols = protocols.join(',');
            }
            wsOptions.protocol = protocols;
         }
         
         if (self._options.agent) {
            wsOptions.agent = self._options.agent;
         }

         console.log(JSON.stringify(wsOptions));
         websocket = new WebSocket(self._options.url, wsOptions);

         transport.send = function (msg) {
            var payload = JSON.stringify(msg);
            websocket.send(payload, {binary: false});
         };

         transport.close = function (code, reason) {
            websocket.close();
         };

         transport._setupPingTimeout = function () {
            if (self._options.ping_timeout) {
               self._ping_timeout = setTimeout(transport._onPingTimeout.bind(self), self._options.ping_timeout);
            }
         };

         transport._clearPingTimeout = function () {
            if (self._ping_timeout) {
               clearTimeout(self._ping_timeout);
               self._ping_timeout = null;
            }
         };

         transport._onPingTimeout = function () {
            websocket.terminate();
            transport.ontimeout();
         };

         websocket.on('open', function () {
            transport.onopen();
            transport._setupPingTimeout();
         });

         websocket.on('message', function (data, flags) {
            if (flags.binary) {
               // FIXME!
            } else {
               var msg = JSON.parse(data);
               transport.onmessage(msg);
            }
         });

         websocket.on('ping', function(data, flags) {
            transport._clearPingTimeout();
            transport._setupPingTimeout();
         });

         // FIXME: improve mapping to WS API for the following
         // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Close_codes
         //
         websocket.on('close', function (code, message) {
            var details = {
               code: code,
               reason: message,
               wasClean: code === 1000
            }
            transport.onclose(details);
         });

         websocket.on('error', function (error) {
            if (error && error.code != "ENOTFOUND" ) {
               console.log("Websocket ERROR");
               console.log(error);
            }

            var details = {
               code: 1006,
               reason: '',
               wasClean: false
            }
            transport.onclose(details);
         });

      })();
   //
   // running in the browser
   //
   } else {

      (function () {

         var websocket;

         // Chrome, MSIE, newer Firefox
         if ("WebSocket" in global) {

            if (self._options.protocols) {
               websocket = new global.WebSocket(self._options.url, self._options.protocols);
            } else {
               websocket = new global.WebSocket(self._options.url);
            }

         // older versions of Firefox prefix the WebSocket object
         } else if ("MozWebSocket" in global) {

            if (self._options.protocols) {
               websocket = new global.MozWebSocket(self._options.url, self._options.protocols);
            } else {
               websocket = new global.MozWebSocket(self._options.url);
            }
         } else {
            throw "browser does not support WebSocket or WebSocket in Web workers";
         }

         websocket.onmessage = function (evt) {
            log.debug("WebSocket transport receive", evt.data);

            var msg = JSON.parse(evt.data);
            transport.onmessage(msg);
         }

         websocket.onopen = function () {
            transport.info.url = self._options.url;
            transport.onopen();
         }

         websocket.onclose = function (evt) {
            var details = {
               code: evt.code,
               reason: evt.message,
               wasClean: evt.wasClean
            }
            transport.onclose(details);
         }

         // do NOT do the following, since that will make
         // transport.onclose() fire twice (browsers already fire
         // websocket.onclose() for errors also)
         //websocket.onerror = websocket.onclose;

         transport.send = function (msg) {
            var payload = JSON.stringify(msg);
            log.debug("WebSocket transport send", payload);
            websocket.send(payload);
         }

         transport.close = function (code, reason) {
            websocket.close(code, reason);
         };

      })();
   }

   return transport;
};



exports.Factory = Factory;
