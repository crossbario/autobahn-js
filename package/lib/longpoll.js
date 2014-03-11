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

var when = require('when');


var _RawLongPoll = function (url, protocols) {
   var self = this;

   self._url = url;

   // our WebSocket shim with W3C API
   var socket = {};

   // these will get defined by the specific shim
   socket.protocol = undefined;
   socket.send = undefined;
   socket.close = undefined;

   // these will get called by the shim.
   // in case user code doesn't override these, provide these NOPs
   socket.onmessage = function () {};
   socket.onopen = function () {};
   socket.onclose = function () {};

   socket._send_buffer = [];
   socket._sender = null;
   socket._is_closing = false;


   socket.close = function (code, reason) {
   };


   var options = {'protocols': ['wamp.2.msgpack', 'wamp.2.json']};

   self.request('http://127.0.0.1:8080/wamp/open', options).then(
      function (res) {
         console.log("ok", res);
         console.log(res.transport);

         var txseq = 0;
         var rxseq = 0;

         socket.send = function (payload) {

            socket._send_buffer.push(payload);
            
            if (!socket._sender) {
               socket._sender = setInterval(function () {

                  if (self._send_buffer.length) {

                     var send_buffer = self._send_buffer.join('\x00');
                     self._send_buffer = [];
                     // send send_buffer .. 

                     txseq += 1;
                     self.request('http://127.0.0.1:8080/wamp/' + res.transport + '/send#' + txseq, send_buffer).then(
                        function (res) {
                           console.log("ok 2", res);
                        },
                        function (code, msg) {
                           console.log("failed", code, msg);
                        }
                     );

                  } else {
                     clearInterval(socket._sender);
                     socket._sender = null;
                  }
               }, 100);
            }
         };

         function receive() {
            rxseq += 1;
            self.request('http://127.0.0.1:8080/wamp/' + res.transport + '/receive+' + rxseq).then(
               function (res) {
                  console.log("receive ok", res);
                  if (!self._is_closing) {
                     receive();
                  }
               },
               function (code, msg) {
                  console.log("receive failed", code, msg);
                  if (!self._is_closing) {
                     receive();
                  }
               }
            );
         }

         receive();
      },
      function (code, msg) {
         console.log("failed", code, msg);
      }
   );

   return socket;
};


_RawLongPoll.prototype.request = function (url, data) {

   var d = when.defer();
   var req = new XMLHttpRequest();

   req.onreadystatechange = function (evt) {

/*      console.log("onreadystatechange", evt, req.readyState);

      console.log(req.readyState);
      console.log(req.response);
      console.log(req.responseText);
      console.log(req.responseType);
*/
      if (req.readyState === 4) {

         if (req.status === 200) {
            var msg = JSON.parse(req.response);
            d.resolve(msg);

         } if (req.status === 204) {
            d.resolve();

         } else {
            //d.reject(req.status, req.statusText);
         }

      }
   }

   req.open("POST", url, true);
   req.setRequestHeader("Content-type", "application/json; charset=utf-8");
/*   
   req.timeout = 500;
   req.ontimeout = function () {
      d.reject(500, "Request Timeout");
   }
*/
   if (data !== undefined) {
      req.send(JSON.stringify(data));
   } else {
      req.send();
   }

   if (d.promise.then) {
      // whenjs has the actual user promise in an attribute
      return d.promise;
   } else {
      return d;
   }
};


var _LongPoll = function (url, options) {
   var self = this;
   self._url = url;
   self._options = options;
};


_LongPoll.prototype.create = function () {
   var self = this;
   return new _RawLongPoll(self._url, ['wamp.2.json']);
};

exports.LongPoll = _LongPoll;
