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


function http_post(url, data, debug) {

   if (debug) {
      console.log("new http_post request", url, data);
   }

   var d = when.defer();
   var req = new XMLHttpRequest();

   req.onreadystatechange = function () {

      if (req.readyState == 4) {

         // Normalize IE's response to HTTP 204 when Win error 1223.
         // http://stackoverflow.com/a/10047236/884770
         //
         var status = (req.status === 1223) ? 204 : req.status;

         if (status === 200) {

            // response with content
            //
            var request_result = null;

            try {
               request_result = req.responseText;
            } catch (e) {
               console.log("ERR", e);
            }

            if (request_result) {
               d.resolve(request_result);
            }

         } if (status === 204) {

            // empty response
            //
            d.resolve();

         } else {
            // FIXME: handle this?
            //d.reject(req.status, req.statusText);
         }

      } else {
         // FIXME: handle this?
      }
   }

   req.open("POST", url, true);
   req.setRequestHeader("Content-type", "application/json; charset=utf-8");

   if (data) {
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


Factory.prototype.type = "longpoll";


Factory.prototype.create = function () {

   var self = this;

   if (self._options.debug) {
      console.log("longpoll.Factory.create");
   }

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

      http_post(self._options.url + '/open', JSON.stringify(options), self._options.debug).then(

         function (payload) {

            session_info = JSON.parse(payload);

            if (self._options.debug) {
               console.log("longpoll.Transport: open", session_info);
            }

            transport.send = function (msg) {

               txseq += 1;

               if (self._options.debug) {
                  console.log("longpoll.Transport: sending message ...", msg);
               }

               var payload = JSON.stringify(msg);

               http_post(self._options.url + '/' + session_info.transport + '/send', payload, self._options.debug).then(
                  function () {
                     // ok, message sent
                     if (self._options.debug) {
                        console.log("longpoll.Transport: message sent");
                     }
                  },
                  function (code, msg) {
                     // FIXME: handle this
                     if (self._options.debug) {
                        console.log("longpoll.Transport: could not send message", code, msg);
                     }
                  }
               );
            };

            function receive() {

               rxseq += 1;

               if (self._options.debug) {
                  console.log("longpoll.Transport: polling for message ...");
               }

               http_post(self._options.url + '/' + session_info.transport + '/receive', null, self._options.debug).then(

                  function (payload) {

                     var msg = JSON.parse(payload);

                     if (self._options.debug) {
                        console.log("longpoll.Transport: message received", msg);
                     }

                     transport.onmessage(msg);

                     if (!is_closing) {
                        receive();
                     }
                  },

                  function (code, msg) {
                     // FIXME: handle this
                     if (self._options.debug) {
                        console.log("longpoll.Transport: could not receive message", code, msg);
                     }
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
