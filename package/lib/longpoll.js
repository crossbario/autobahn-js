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

   websocket.send = function (msg) {
   };

   websocket.close = function (code, reason) {
   };
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

   return d.promise;
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
