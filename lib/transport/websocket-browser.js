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

function BrowserWebsocketTransport(transport, options) {

  var websocket;

  // Chrome, MSIE, newer Firefox
  if ("WebSocket" in global) {

    if (options.protocols) {
      websocket = new global.WebSocket(options.url, options.protocols);
    } else {
      websocket = new global.WebSocket(options.url);
    }
    websocket.binaryType = 'arraybuffer';

  // older versions of Firefox prefix the WebSocket object
  } else if ("MozWebSocket" in global) {

    if (options.protocols) {
      websocket = new global.MozWebSocket(options.url, options.protocols);
    } else {
      websocket = new global.MozWebSocket(options.url);
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
    for (var index in options.serializers) {
      var serializer = options.serializers[index];
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
};

BrowserWebsocketTransport.prototype.sendAutoPing = function () {

};

exports = BrowserWebsocketTransport;
