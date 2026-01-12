///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (c) typedef int GmbH and contributors
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

   // Use native WebSocket (available in browsers and Node.js 22+)
   (function () {

      var websocket;

      if (self._options.protocols) {
         websocket = new WebSocket(self._options.url, self._options.protocols);
      } else {
         websocket = new WebSocket(self._options.url);
      }
      websocket.binaryType = 'arraybuffer';

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
            reason: evt.reason,
            wasClean: evt.wasClean
         }
         transport.onclose(details);
      }

      // do NOT do the following, since that will make
      // transport.onclose() fire twice (browsers already fire
      // websocket.onclose() for errors also)
      //websocket.onerror = websocket.onclose;

      transport.send = async function (msg) {
         let payload = await transport.serializer.serialize(msg);
         log.debug("WebSocket transport send", payload);
         websocket.send(payload);
      }

      transport.close = function (code, reason) {
         websocket.close(code, reason);
      };

   })();

   return transport;
};


exports.Factory = Factory;
