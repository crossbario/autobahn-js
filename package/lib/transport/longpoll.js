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
var when = require('when');


function http_post(url, data) {

   var d = when.defer();
   var req = new XMLHttpRequest();

   req.onreadystatechange = function (evt) {
/*
     console.log("onreadystatechange", evt, req.readyState);

      console.log(req.readyState);
      console.log(req.response);
      console.log(req.responseText);
      console.log(req.responseType);
*/
      if (req.readyState === 4) {

         if (req.status === 200) {
            d.resolve(req.response);

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
      req.send(data);
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



function Factory (options) {
   var self = this;

   util.assert(options.url !== undefined, "options.url missing");
   util.assert(typeof options.url === "string", "options.url must be a string");

   self._options = options;
};


Factory.type = "longpoll";


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


   transport._run = function () {

      var session_info = null;
      var send_buffer = [];
      var is_closing = false;

      var txseq = 0;
      var rxseq = 0;

      var options = {'protocols': ['wamp.2.json']};

      http_post(self._options.url + '/open', JSON.stringify(options)).then(

         function (payload) {

            session_info = JSON.parse(payload);

            transport.send = function (msg) {

               txseq += 1;

               var payload = JSON.stringify(msg);

               http_post(self._options.url + '/' + session_info.transport + '/send', payload).then(
                  function (res) {
                     // ok, message sent
                  },
                  function (code, msg) {
                     // FIXME: handle this
                     console.log("could not send message", code, msg);
                  }
               );
            };

            function receive() {

               rxseq += 1;

               http_post(self._options.url + '/' + session_info.transport + '/receive').then(
                  function (payload) {
                     var msg = JSON.parse(payload);

                     transport.onmessage(msg);

                     if (!is_closing) {
                        receive();
                     }
                  },
                  function (code, msg) {
                     // FIXME: handle this
                     console.log("could not receive message", code, msg);
                  }
               );
            }

            receive();

            transport.onopen();
         },

         function (code, msg) {
            // FIXME: handle this
            console.log("could not create session", code, msg);
         }
      );

   }

   transport._run();

   return transport;
};



exports.Factory = Factory;
