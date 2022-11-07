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

   if (options.autoping_interval) {
     util.assert(options.autoping_interval > 0, "options.autoping_interval must be greater than 0");
     options.autoping_interval = options.autoping_interval * 1000
   } else {
     options.autoping_interval = 10000;
   }

   if (options.autoping_timeout) {
     util.assert(options.autoping_timeout > 0, "options.autoping_timeout must be greater than 0");
     options.autoping_timeout = options.autoping_timeout * 1000
   } else {
     options.autoping_timeout = 5000;
   }

   if (options.autoping_size) {
     util.assert(options.autoping_size >= 4 && options.autoping_size <= 125,
         "options.autoping_size must be between 4 and 125");
   } else {
     options.autoping_size = 4;
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

   if ("WebSocket" in global) {
      (function () {

         var websocket;

         if (self._options.protocols) {
            websocket = new global.WebSocket(self._options.url, self._options.protocols);
         } else {
            websocket = new global.WebSocket(self._options.url);
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
               reason: evt.message,
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
   } else {
      (function () {

         var WebSocket = require('ws'); // https://github.com/websockets/ws
         var randomBytes = require('tweetnacl').randomBytes;
         var websocket;

         var options = {
            agent : self._options.agent,
            headers : self._options.headers
         };

         var protocols;
         if (self._options.protocols) {
            protocols = self._options.protocols;
            if (Array.isArray(protocols)) {
               protocols = protocols.join(',');
            }
            options.protocol = protocols;
         }

         if (self._options.url.startsWith('wss://') &&
             self._options.tlsConfiguration) {

            if (self._options.tlsConfiguration.ca &&
                self._options.tlsConfiguration.cert &&
                self._options.tlsConfiguration.key) {

               // Using TLS
               // Only using the known working flags in the options.
               // https://nodejs.org/api/https.html#https_https_request_options_callback

               log.debug('Using TLS Client Authentication.');

               options.ca = self._options.tlsConfiguration.ca;
               options.cert = self._options.tlsConfiguration.cert;
               options.key = self._options.tlsConfiguration.key;
               options.rejectUnauthorized = false;
            } else {
               log.debug("Not using TLS Client Authentication. tlsConfiguration should include " +
                   "'ca' 'cert' and 'key' parameters.");
            }
         } else {
            log.debug('Not using TLS Client Authentication.');
         }

         websocket = new WebSocket(self._options.url, protocols, options);

         transport.send = async function (msg) {
            let payload = await transport.serializer.serialize(msg);
            websocket.send(payload, {binary: transport.serializer.BINARY});
         };

         transport.close = function (code, reason) {
            websocket.close();
         };

         var auto_ping_interval;
         var last_read_time;

         function update_last_read_time() {
            last_read_time = new Date();
         }

         function get_time_since_last_read() {
            return new Date() - last_read_time;
         }

         websocket.on('open', function () {
            update_last_read_time();
            var serializer_part = websocket.protocol.split('.')[2];
            for (var index in self._options.serializers) {
               var serializer = self._options.serializers[index];
               if (serializer.SERIALIZER_ID == serializer_part) {
                  transport.serializer = serializer;
                  break;
               }
            }

            transport.info.protocol = websocket.protocol;

            // https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
            websocket.isAlive = true;
            auto_ping_interval = setInterval(function ping() {
               if (websocket.isAlive === false) {
                  clearInterval(auto_ping_interval);
                  return websocket.terminate();
               }

               // Do not send a ping because we received a message a moment ago
               if (get_time_since_last_read() < self._options.autoping_interval) {
                  return;
               }
               websocket.isAlive = false;
               websocket.ping(randomBytes(self._options.autoping_size));
            }, self._options.autoping_interval);

            transport.onopen();
         });

         websocket.on('pong', function () {
            update_last_read_time();
            this.isAlive = true;
         });

         websocket.on('message', function (data, flags) {
            update_last_read_time();
            var msg = transport.serializer.unserialize(data);
            transport.onmessage(msg);
         });

         // FIXME: improve mapping to WS API for the following
         // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Close_codes
         //
         websocket.on('close', function (code, message) {
            if (auto_ping_interval != null) clearInterval(auto_ping_interval);
            var details = {
               code: code,
               reason: message,
               wasClean: code === 1000
            }
            transport.onclose(details);
         });

         websocket.on('error', function (error) {
            if (auto_ping_interval != null) clearInterval(auto_ping_interval);
            var details = {
               code: 1006,
               reason: '',
               wasClean: false
            }
            transport.onclose(details);
         });

      })();
   }

   return transport;
};


exports.Factory = Factory;
