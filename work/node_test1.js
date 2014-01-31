/*
   npm install websocket
   npm install when
 */

function create_WebSocket(root, url, protocols) {

   if (typeof module !== 'undefined' && this.module !== module) {
      console.log("running on NodeJS");

      // for now, expect
      // https://github.com/Worlize/WebSocket-Node
      //
      var WebSocketClient = require('websocket').client;
      var client = new WebSocketClient();

      // our WebSocket shim with W3C API
      var websocket = {};

      websocket.protocol = undefined;

      websocket.onmessage = function (e) {
      }
      websocket.onopen = function (e) {
      }
      websocket.onclose = function (e) {
      }


      client.on('connectFailed', function (error) {
         // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
         websocket.onclose({code: 1000, reason: error.toString(), wasClean: false});
      });

      client.on('connect', function (connection) {

         websocket.protocol = connection.protocol;

         websocket.send = function (msg) {
            if (connection.connected) {
               // sending a string that gets encoded as UTF8
               // https://github.com/Worlize/WebSocket-Node/blob/master/lib/WebSocketConnection.js#L587
               connection.sendUTF(msg);

               // https://github.com/Worlize/WebSocket-Node/blob/master/lib/WebSocketConnection.js#L594
               // sending a Node Buffer
               //connection.sendBytes(msg);
            }
         }

         websocket.close = function (code, reason) {
            connection.close();
         }

         websocket.onopen();
    
         connection.on('error', function (error) {
            // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
            websocket.onclose({code: 1000, reason: error.toString(), wasClean: true});
         });

         connection.on('close', function (code, reason) {
            // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
            websocket.onclose({code: code, reason: reason, wasClean: true});
         });

         connection.on('message', function (message) {
            // https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
            if (message.type === 'utf8') {
               websocket.onmessage({data: message.utf8Data});
            }
         });

      });

      if (protocols) {
         client.connect(url, protocols);
      } else {
         client.connect(url);
      }

      return websocket;

   } else if ('window' in root) {

      console.log("running in browser");

      if ("WebSocket" in root) {
         // Chrome, MSIE, newer Firefox
         if (protocols) {
            return new root.WebSocket(url, protocols);
         } else {
            return new root.WebSocket(url);
         }
      } else if ("MozWebSocket" in root) {
         // older versions of Firefox prefix the WebSocket object
         if (protocols) {
            return new root.MozWebSocket(url, protocols);
         } else {
            return new root.MozWebSocket(url);
         }
      } else {
         return null;
      }

   } else {

      console.log("could not detect environment");
      return null;
   }
}

var when = require('when');

var socket = create_WebSocket(this, 'ws://127.0.0.1:9000/');

socket.onmessage = function (evt) {
   console.log(evt.data);
   socket.close();
}

socket.onopen = function () {
   console.log("connected!");
   socket.send("Hello, world.")
}

socket.onclose = function (evt) {
   console.log(evt.reason);
}