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
var serializer = require('../serializer.js');

function Factory (options) {
   var self = this;

   util.assert(options.url !== undefined, "options.url missing");
   util.assert(typeof options.url === "string", "options.url must be a string");

   if (!options.serializers) {
      options.serializers = [new serializer.JSONSerializer()];
      if (serializer.MsgpackSerializer) {
         options.serializers.push(new serializer.MsgpackSerializer());
      }
   } else {
      util.assert(Array.isArray(options.serializers), "options.serializers must be an array");
   }

   if (!options.protocols) {
      options.protocols = [];
      options.serializers.forEach(function (ser) {
         options.protocols.push("wamp.2." + ser.SERIALIZER_ID);
      });
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
   transport.serializer = undefined;
   transport.send = undefined;
   transport.close = undefined;

   // these will get overridden by the WAMP session using this transport
   transport.onmessage = function () {};
   transport.onopen = function () {};
   transport.onclose = function () {};

   transport.info = {
      type: 'websocket',
      url: self._options.url,
      protocol: null
   };


   // Test below used to be via the 'window' object in the browser.
   // This fails when running in a Web worker.
   //
   // running in Node.js
   //
   if (global.process && global.process.versions.node) {

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
            var payload = transport.serializer.serialize(msg);
            websocket.send(payload, {binary: transport.serializer.BINARY});
         };

         transport.close = function (code, reason) {
            websocket.close();
         };

         websocket.on('open', function () {
            var serializer_part = websocket.protocol.split('.')[2];
            for (var index in self._options.serializers) {
               var serializer = self._options.serializers[index];
               if (serializer.SERIALIZER_ID == serializer_part) {
                  transport.serializer = serializer;
                  break;
               }
            }

            transport.info.protocol = websocket.protocol;
            transport.onopen();
         });

         websocket.on('message', function (data, flags) {
            var msg = transport.serializer.unserialize(data);
            transport.onmessage(msg);
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
            websocket.binaryType = 'arraybuffer';

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

            var msg = transport.serializer.unserialize(evt.data);
            transport.onmessage(msg);
         }

         websocket.onopen = function () {
            var serializer_part = websocket.protocol.split('.')[2];
            for (var index in self._options.serializers) {
               var serializer = self._options.serializers[index];
               if (serializer.SERIALIZER_ID == serializer_part) {
                  transport.serializer = serializer;
                  break;
               }
            }

            transport.info.protocol = websocket.protocol;
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
            var payload = transport.serializer.serialize(msg);
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
