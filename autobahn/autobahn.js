/** @license MIT License (c) 2011-2013 Copyright Tavendo GmbH. */

/**
 * AutobahnJS - http://autobahn.ws
 *
 * A lightweight implementation of
 *
 *   WAMP (The WebSocket Application Messaging Protocol) - http://wamp.ws
 *
 * Provides asynchronous RPC/PubSub over WebSocket.
 *
 * Copyright (C) 2011-2014 Tavendo GmbH. Licensed under the MIT License.
 * See license text at http://www.opensource.org/licenses/mit-license.php
 */

/* global console: false, MozWebSocket: false, when: false, CryptoJS: false */

/**
 * @define {string}
 */
var AUTOBAHNJS_VERSION = '?.?.?';
var global = this;

(function (root, factory) {
   if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(['when'], function (when) {
         // Also create a global in case some scripts
         // that are loaded still are looking for
         // a global even when an AMD loader is in use.
         return (root.ab = factory(root, when));
      });

   } else if (typeof exports !== 'undefined') {
      // Support Node.js specific `module.exports` (which can be a function)
      if (typeof module != 'undefined' && module.exports) {
         exports = module.exports = factory(root, root.when);
      }
      // But always support CommonJS module 1.1.1 spec (`exports` cannot be a function)
      //exports.ab = exports;

   } else {
      // Browser globals
      root.ab = factory(root, root.when);
   }
} (global, function (root, when) {

   "use strict";

   var ab = {};
   ab._version = AUTOBAHNJS_VERSION;

   /**
    * Fallbacks for browsers lacking
    *
    *    Array.prototype.indexOf
    *    Array.prototype.forEach
    *
    * most notably MSIE8.
    *
    * Source:
    *    https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
    *    https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
    */
   (function () {
      if (!Array.prototype.indexOf) {
         Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
            "use strict";
            if (this === null) {
               throw new TypeError();
            }
            var t = new Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
               return -1;
            }
            var n = 0;
            if (arguments.length > 0) {
               n = Number(arguments[1]);
               if (n !== n) { // shortcut for verifying if it's NaN
                  n = 0;
               } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                  n = (n > 0 || -1) * Math.floor(Math.abs(n));
               }
            }
            if (n >= len) {
               return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
               if (k in t && t[k] === searchElement) {
                  return k;
               }
            }
            return -1;
         };
      }

      if (!Array.prototype.forEach) {

         Array.prototype.forEach = function (callback, thisArg) {

            var T, k;

            if (this === null) {
               throw new TypeError(" this is null or not defined");
            }

            // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
            var O = new Object(this);

            // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0; // Hack to convert O.length to a UInt32

            // 4. If IsCallable(callback) is false, throw a TypeError exception.
            // See: http://es5.github.com/#x9.11
            if ({}.toString.call(callback) !== "[object Function]") {
               throw new TypeError(callback + " is not a function");
            }

            // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (thisArg) {
               T = thisArg;
            }

            // 6. Let k be 0
            k = 0;

            // 7. Repeat, while k < len
            while (k < len) {

               var kValue;

               // a. Let Pk be ToString(k).
               //   This is implicit for LHS operands of the in operator
               // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
               //   This step can be combined with c
               // c. If kPresent is true, then
               if (k in O) {

                  // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                  kValue = O[k];

                  // ii. Call the Call internal method of callback with T as the this value and
                  // argument list containing kValue, k, and O.
                  callback.call(T, kValue, k, O);
               }
               // d. Increase k by 1.
               k++;
            }
            // 8. return undefined
         };
      }

   })();


   // Helper to slice out browser / version from userAgent
   ab._sliceUserAgent = function (str, delim, delim2) {
      var ver = [];
      var ua = navigator.userAgent;
      var i = ua.indexOf(str);
      var j = ua.indexOf(delim, i);
      if (j < 0) {
         j = ua.length;
      }
      var agent = ua.slice(i, j).split(delim2);
      var v = agent[1].split('.');
      for (var k = 0; k < v.length; ++k) {
         ver.push(parseInt(v[k], 10));
      }
      return {name: agent[0], version: ver};
   };

   /**
    * Detect browser and browser version.
    */
   ab.getBrowser = function () {

      var ua = navigator.userAgent;
      if (ua.indexOf("Chrome") > -1) {
         return ab._sliceUserAgent("Chrome", " ", "/");
      } else if (ua.indexOf("Safari") > -1) {
         return ab._sliceUserAgent("Safari", " ", "/");
      } else if (ua.indexOf("Firefox") > -1) {
         return ab._sliceUserAgent("Firefox", " ", "/");
      } else if (ua.indexOf("MSIE") > -1) {
         return ab._sliceUserAgent("MSIE", ";", " ");
      } else {
         return null;
      }
   };


   ab.getServerUrl = function (wsPath, fallbackUrl) {
      if (root.location.protocol === "file:") {
         if (fallbackUrl) {
            return fallbackUrl;
         } else {
            return "ws://127.0.0.1/ws";
         }
      } else {
         var scheme = root.location.protocol === 'https:' ? 'wss://' : 'ws://';
         var port = root.location.port !== "" ? ':' + root.location.port : '';
         var path = wsPath ? wsPath : 'ws';
         return scheme + root.location.hostname + port + "/" + path;
      }
   };


   // Logging message for unsupported browser.
   ab.browserNotSupportedMessage = "Browser does not support WebSockets (RFC6455)";


   // PBKDF2-base key derivation function for salted WAMP-CRA
   ab.deriveKey = function (secret, extra) {
      if (extra && extra.salt) {
         var salt = extra.salt;
         var keylen = extra.keylen || 32;
         var iterations = extra.iterations || 10000;
         var key = CryptoJS.PBKDF2(secret, salt, { keySize: keylen / 4, iterations: iterations, hasher: CryptoJS.algo.SHA256 });
         return key.toString(CryptoJS.enc.Base64);
      } else {
         return secret;
      }
   };


   ab._idchars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   ab._idlen = 16;
   ab._subprotocol = "wamp";

   ab._newid = function () {
      var id = "";
      for (var i = 0; i < ab._idlen; i += 1) {
         id += ab._idchars.charAt(Math.floor(Math.random() * ab._idchars.length));
      }
      return id;
   };

   ab._newidFast = function () {
       return Math.random().toString(36);
   };

   ab.log = function () {
         //console.log.apply(console, !!arguments.length ? arguments : [this]);
         if (arguments.length > 1) {
            console.group("Log Item");
            for (var i = 0; i < arguments.length; i += 1) {
               console.log(arguments[i]);
            }
            console.groupEnd();
         } else {
            console.log(arguments[0]);
         }
   };

   ab._debugrpc = false;
   ab._debugpubsub = false;
   ab._debugws = false;
   ab._debugconnect = false;

   ab.debug = function (debugWamp, debugWs, debugConnect) {
      if ("console" in root) {
         ab._debugrpc = debugWamp;
         ab._debugpubsub = debugWamp;
         ab._debugws = debugWs;
         ab._debugconnect = debugConnect;
      } else {
         throw "browser does not support console object";
      }
   };

   ab.version = function () {
      return ab._version;
   };

   ab.PrefixMap = function () {

      var self = this;
      self._index = {};
      self._rindex = {};
   };

   ab.PrefixMap.prototype.get = function (prefix) {

      var self = this;
      return self._index[prefix];
   };

   ab.PrefixMap.prototype.set = function (prefix, uri) {

      var self = this;
      self._index[prefix] = uri;
      self._rindex[uri] = prefix;
   };

   ab.PrefixMap.prototype.setDefault = function (uri) {

      var self = this;
      self._index[""] = uri;
      self._rindex[uri] = "";
   };

   ab.PrefixMap.prototype.remove = function (prefix) {

      var self = this;
      var uri = self._index[prefix];
      if (uri) {
         delete self._index[prefix];
         delete self._rindex[uri];
      }
   };

   ab.PrefixMap.prototype.resolve = function (curie, pass) {

      var self = this;

      // skip if not a CURIE
      var i = curie.indexOf(":");
      if (i >= 0) {
         var prefix = curie.substring(0, i);
         if (self._index[prefix]) {
            return self._index[prefix] + curie.substring(i + 1);
         }
      }

      // either pass-through or null
      if (pass === true) {
         return curie;
      } else {
         return null;
      }
   };

   ab.PrefixMap.prototype.shrink = function (uri, pass) {

      var self = this;

      for (var i = uri.length; i > 0; i -= 1) {
         var u = uri.substring(0, i);
         var p = self._rindex[u];
         if (p) {
            return p + ":" + uri.substring(i);
         }
      }

      // either pass-through or null
      if (pass === true) {
         return uri;
      } else {
         return null;
      }
   };


   ab._MESSAGE_TYPEID_WELCOME        = 0;
   ab._MESSAGE_TYPEID_PREFIX         = 1;
   ab._MESSAGE_TYPEID_CALL           = 2;
   ab._MESSAGE_TYPEID_CALL_RESULT    = 3;
   ab._MESSAGE_TYPEID_CALL_ERROR     = 4;
   ab._MESSAGE_TYPEID_SUBSCRIBE      = 5;
   ab._MESSAGE_TYPEID_UNSUBSCRIBE    = 6;
   ab._MESSAGE_TYPEID_PUBLISH        = 7;
   ab._MESSAGE_TYPEID_EVENT          = 8;

   ab.CONNECTION_CLOSED = 0;
   ab.CONNECTION_LOST = 1;
   ab.CONNECTION_RETRIES_EXCEEDED = 2;
   ab.CONNECTION_UNREACHABLE = 3;
   ab.CONNECTION_UNSUPPORTED = 4;
   ab.CONNECTION_UNREACHABLE_SCHEDULED_RECONNECT = 5;
   ab.CONNECTION_LOST_SCHEDULED_RECONNECT = 6;

   ab.Deferred = when.defer;
   //ab.Deferred = jQuery.Deferred;

   ab._construct = function (url, protocols) {
      if ("WebSocket" in root) {
         // Chrome, MSIE, newer Firefox
         if (protocols) {
            return new WebSocket(url, protocols);
         } else {
            return new WebSocket(url);
         }
      } else if ("MozWebSocket" in root) {
         // older versions of Firefox prefix the WebSocket object
         if (protocols) {
            return new MozWebSocket(url, protocols);
         } else {
            return new MozWebSocket(url);
         }
      } else {
         return null;
      }
   };

   ab.Session = function (wsuri, onopen, onclose, options) {

      var self = this;

      self._wsuri = wsuri;
      self._options = options;
      self._websocket_onopen = onopen;
      self._websocket_onclose = onclose;

      self._websocket = null;
      self._websocket_connected = false;

      self._session_id = null;
      self._wamp_version = null;
      self._server = null;

      self._calls = {};
      self._subscriptions = {};
      self._prefixes = new ab.PrefixMap();

      self._txcnt = 0;
      self._rxcnt = 0;

      if (self._options && self._options.skipSubprotocolAnnounce) {
         self._websocket = ab._construct(self._wsuri);
      } else {
         self._websocket = ab._construct(self._wsuri, [ab._subprotocol]);
      }

      if (!self._websocket) {
         if (onclose !== undefined) {
            onclose(ab.CONNECTION_UNSUPPORTED);
            return;
         } else {
            throw ab.browserNotSupportedMessage;
         }
      }

      self._websocket.onmessage = function (e)
      {
         if (ab._debugws) {
            self._rxcnt += 1;
            console.group("WS Receive");
            console.info(self._wsuri + "  [" + self._session_id + "]");
            console.log(self._rxcnt);
            console.log(e.data);
            console.groupEnd();
         }

         var o = JSON.parse(e.data);
         if (o[1] in self._calls)
         {
            if (o[0] === ab._MESSAGE_TYPEID_CALL_RESULT) {

               var dr = self._calls[o[1]];
               var r = o[2];

               if (ab._debugrpc && dr._ab_callobj !== undefined) {
                  console.group("WAMP Call", dr._ab_callobj[2]);
                  console.timeEnd(dr._ab_tid);
                  console.group("Arguments");
                  for (var i = 3; i < dr._ab_callobj.length; i += 1) {
                     var arg = dr._ab_callobj[i];
                     if (arg !== undefined) {
                        console.log(arg);
                     } else {
                        break;
                     }
                  }
                  console.groupEnd();
                  console.group("Result");
                  console.log(r);
                  console.groupEnd();
                  console.groupEnd();
               }

               dr.resolve(r);
            }
            else if (o[0] === ab._MESSAGE_TYPEID_CALL_ERROR) {

               var de = self._calls[o[1]];
               var uri_ = o[2];
               var desc_ = o[3];
               var detail_ = o[4];

               if (ab._debugrpc && de._ab_callobj !== undefined) {
                  console.group("WAMP Call", de._ab_callobj[2]);
                  console.timeEnd(de._ab_tid);
                  console.group("Arguments");
                  for (var j = 3; j < de._ab_callobj.length; j += 1) {
                     var arg2 = de._ab_callobj[j];
                     if (arg2 !== undefined) {
                        console.log(arg2);
                     } else {
                        break;
                     }
                  }
                  console.groupEnd();
                  console.group("Error");
                  console.log(uri_);
                  console.log(desc_);
                  if (detail_ !== undefined) {
                     console.log(detail_);
                  }
                  console.groupEnd();
                  console.groupEnd();
               }

               if (detail_ !== undefined) {
                  de.reject({uri: uri_, desc: desc_, detail: detail_});
               } else {
                  de.reject({uri: uri_, desc: desc_});
               }
            }
            delete self._calls[o[1]];
         }
         else if (o[0] === ab._MESSAGE_TYPEID_EVENT)
         {
            var subid = self._prefixes.resolve(o[1], true);
            if (subid in self._subscriptions) {

               var uri2 = o[1];
               var val = o[2];

               if (ab._debugpubsub) {
                  console.group("WAMP Event");
                  console.info(self._wsuri + "  [" + self._session_id + "]");
                  console.log(uri2);
                  console.log(val);
                  console.groupEnd();
               }

               self._subscriptions[subid].forEach(function (callback) {

                  callback(uri2, val);
               });
            }
            else {
               // ignore unsolicited event!
            }
         }
         else if (o[0] === ab._MESSAGE_TYPEID_WELCOME)
         {
            if (self._session_id === null) {
               self._session_id = o[1];
               self._wamp_version = o[2];
               self._server = o[3];

               if (ab._debugrpc || ab._debugpubsub) {
                  console.group("WAMP Welcome");
                  console.info(self._wsuri + "  [" + self._session_id + "]");
                  console.log(self._wamp_version);
                  console.log(self._server);
                  console.groupEnd();
               }

               // only now that we have received the initial server-to-client
               // welcome message, fire application onopen() hook
               if (self._websocket_onopen !== null) {
                  self._websocket_onopen();
               }
            } else {
               throw "protocol error (welcome message received more than once)";
            }
         }
      };

      self._websocket.onopen = function (e)
      {
         // check if we can speak WAMP!
         if (self._websocket.protocol !== ab._subprotocol) {

            if (typeof self._websocket.protocol === 'undefined') {
               // i.e. Safari does subprotocol negotiation (broken), but then
               // does NOT set the protocol attribute of the websocket object (broken)
               //
               if (ab._debugws) {
                  console.group("WS Warning");
                  console.info(self._wsuri);
                  console.log("WebSocket object has no protocol attribute: WAMP subprotocol check skipped!");
                  console.groupEnd();
               }
            }
            else if (self._options && self._options.skipSubprotocolCheck) {
               // WAMP subprotocol check disabled by session option
               //
               if (ab._debugws) {
                  console.group("WS Warning");
                  console.info(self._wsuri);
                  console.log("Server does not speak WAMP, but subprotocol check disabled by option!");
                  console.log(self._websocket.protocol);
                  console.groupEnd();
               }
            } else {
               // we only speak WAMP .. if the server denied us this, we bail out.
               //
               self._websocket.close(1000, "server does not speak WAMP");
               throw "server does not speak WAMP (but '" + self._websocket.protocol + "' !)";
            }
         }
         if (ab._debugws) {
            console.group("WAMP Connect");
            console.info(self._wsuri);
            console.log(self._websocket.protocol);
            console.groupEnd();
         }
         self._websocket_connected = true;
      };

      self._websocket.onerror = function (e)
      {
         // FF fires this upon unclean closes
         // Chrome does not fire this
      };

      self._websocket.onclose = function (e)
      {
         if (ab._debugws) {
            if (self._websocket_connected) {
               console.log("Autobahn connection to " + self._wsuri + " lost (code " + e.code + ", reason '" + e.reason + "', wasClean " + e.wasClean + ").");
            } else {
               console.log("Autobahn could not connect to " + self._wsuri + " (code " + e.code + ", reason '" + e.reason + "', wasClean " + e.wasClean + ").");
            }
         }

         // fire app callback
         if (self._websocket_onclose !== undefined) {
            if (self._websocket_connected) {
               if (e.wasClean) {
                  // connection was closed cleanly (closing HS was performed)
                  self._websocket_onclose(ab.CONNECTION_CLOSED, "WS-" + e.code + ": " + e.reason);
               } else {
                  // connection was closed uncleanly (lost without closing HS)
                  self._websocket_onclose(ab.CONNECTION_LOST);
               }
            } else {
               // connection could not be established in the first place
               self._websocket_onclose(ab.CONNECTION_UNREACHABLE);
            }
         }

         // cleanup - reconnect requires a new session object!
         self._websocket_connected = false;
         self._wsuri = null;
         self._websocket_onopen = null;
         self._websocket_onclose = null;
         self._websocket = null;
      };

      self.log = function () {
         if (self._options && 'sessionIdent' in self._options) {
            console.group("WAMP Session '" + self._options.sessionIdent + "' [" + self._session_id + "]");
         } else {
            console.group("WAMP Session " + "[" + self._session_id + "]");
         }
         for (var i = 0; i < arguments.length; ++i) {
            console.log(arguments[i]);
         }
         console.groupEnd();
      };
   };


   ab.Session.prototype._send = function (msg) {

      var self = this;

      if (!self._websocket_connected) {
         throw "Autobahn not connected";
      }

      var rmsg;
      switch (true)
      {
         // In the event that prototype library is in existance run the toJSON method prototype provides
         // else run the standard JSON.stringify
         // this is a very clever problem that causes json to be double-quote-encoded.
         case root.Prototype && typeof top.root.__prototype_deleted === 'undefined':
         case typeof msg.toJSON === 'function':
            rmsg = msg.toJSON();
            break;

         // we could do instead
         // msg.toJSON = function(){return msg};
         // rmsg = JSON.stringify(msg);
          default:
            rmsg = JSON.stringify(msg);
      }

      self._websocket.send(rmsg);
      self._txcnt += 1;

      if (ab._debugws) {
         console.group("WS Send");
         console.info(self._wsuri + "  [" + self._session_id + "]");
         console.log(self._txcnt);
         console.log(rmsg);
         console.groupEnd();
      }
   };


   ab.Session.prototype.close = function () {

      var self = this;

      if (self._websocket_connected) {
         self._websocket.close();
      } else {
         //throw "Autobahn not connected";
      }
   };


   ab.Session.prototype.sessionid = function () {

      var self = this;
      return self._session_id;
   };


   ab.Session.prototype.wsuri = function () {

      var self = this;
      return self._wsuri;
   };


   ab.Session.prototype.shrink = function (uri, pass) {

      var self = this;
      if (pass === undefined) pass = true;
      return self._prefixes.shrink(uri, pass);
   };


   ab.Session.prototype.resolve = function (curie, pass) {

      var self = this;
      if (pass === undefined) pass = true;
      return self._prefixes.resolve(curie, pass);
   };


   ab.Session.prototype.prefix = function (prefix, uri) {

      var self = this;

   /*
      if (self._prefixes.get(prefix) !== undefined) {
         throw "prefix '" + prefix + "' already defined";
      }
   */

      self._prefixes.set(prefix, uri);

      if (ab._debugrpc || ab._debugpubsub) {
         console.group("WAMP Prefix");
         console.info(self._wsuri + "  [" + self._session_id + "]");
         console.log(prefix);
         console.log(uri);
         console.groupEnd();
      }

      var msg = [ab._MESSAGE_TYPEID_PREFIX, prefix, uri];
      self._send(msg);
   };


   ab.Session.prototype.call = function () {

      var self = this;

      var d = new ab.Deferred();
      var callid;
      while (true) {
         callid = ab._newidFast();
         if (!(callid in self._calls)) {
            break;
         }
      }
      self._calls[callid] = d;

      var procuri = self._prefixes.shrink(arguments[0], true);
      var obj = [ab._MESSAGE_TYPEID_CALL, callid, procuri];
      for (var i = 1; i < arguments.length; i += 1) {
         obj.push(arguments[i]);
      }

      self._send(obj);

      if (ab._debugrpc) {
         d._ab_callobj = obj;
         d._ab_tid = self._wsuri + "  [" + self._session_id + "][" + callid + "]";
         console.time(d._ab_tid);
         console.info();
      }

      if (d.promise.then) {
         // whenjs has the actual user promise in an attribute
         return d.promise;
      } else {
         return d;
      }
   };


   ab.Session.prototype.subscribe = function (topicuri, callback) {

      var self = this;

      // subscribe by sending WAMP message when topic not already subscribed
      //
      var rtopicuri = self._prefixes.resolve(topicuri, true);
      if (!(rtopicuri in self._subscriptions)) {

         if (ab._debugpubsub) {
            console.group("WAMP Subscribe");
            console.info(self._wsuri + "  [" + self._session_id + "]");
            console.log(topicuri);
            console.log(callback);
            console.groupEnd();
         }

         var msg = [ab._MESSAGE_TYPEID_SUBSCRIBE, topicuri];
         self._send(msg);

         self._subscriptions[rtopicuri] = [];
      }

      // add callback to event listeners list if not already in list
      //
      var i = self._subscriptions[rtopicuri].indexOf(callback);
      if (i === -1) {
         self._subscriptions[rtopicuri].push(callback);
      }
      else {
         throw "callback " + callback + " already subscribed for topic " + rtopicuri;
      }
   };


   ab.Session.prototype.unsubscribe = function (topicuri, callback) {

      var self = this;

      var rtopicuri = self._prefixes.resolve(topicuri, true);
      if (!(rtopicuri in self._subscriptions)) {
         throw "not subscribed to topic " + rtopicuri;
      }
      else {
         var removed;
         if (callback !== undefined) {
            var idx = self._subscriptions[rtopicuri].indexOf(callback);
            if (idx !== -1) {
               removed = callback;
               self._subscriptions[rtopicuri].splice(idx, 1);
            }
            else {
               throw "no callback " + callback + " subscribed on topic " + rtopicuri;
            }
         }
         else {
            removed = self._subscriptions[rtopicuri].slice();
            self._subscriptions[rtopicuri] = [];
         }

         if (self._subscriptions[rtopicuri].length === 0) {

            delete self._subscriptions[rtopicuri];

            if (ab._debugpubsub) {
               console.group("WAMP Unsubscribe");
               console.info(self._wsuri + "  [" + self._session_id + "]");
               console.log(topicuri);
               console.log(removed);
               console.groupEnd();
            }

            var msg = [ab._MESSAGE_TYPEID_UNSUBSCRIBE, topicuri];
            self._send(msg);
         }
      }
   };


   ab.Session.prototype.publish = function () {

      var self = this;

      var topicuri = arguments[0];
      var event = arguments[1];

      var excludeMe = null;
      var exclude = null;
      var eligible = null;

      var msg = null;

      if (arguments.length > 3) {

         if (!(arguments[2] instanceof Array)) {
            throw "invalid argument type(s)";
         }
         if (!(arguments[3] instanceof Array)) {
            throw "invalid argument type(s)";
         }

         exclude = arguments[2];
         eligible = arguments[3];
         msg = [ab._MESSAGE_TYPEID_PUBLISH, topicuri, event, exclude, eligible];

      } else if (arguments.length > 2) {

         if (typeof(arguments[2]) === 'boolean') {

            excludeMe = arguments[2];
            msg = [ab._MESSAGE_TYPEID_PUBLISH, topicuri, event, excludeMe];

         } else if (arguments[2] instanceof Array) {

            exclude = arguments[2];
            msg = [ab._MESSAGE_TYPEID_PUBLISH, topicuri, event, exclude];

         } else {
            throw "invalid argument type(s)";
         }

      } else {

         msg = [ab._MESSAGE_TYPEID_PUBLISH, topicuri, event];
      }

      if (ab._debugpubsub) {
         console.group("WAMP Publish");
         console.info(self._wsuri + "  [" + self._session_id + "]");
         console.log(topicuri);
         console.log(event);

         if (excludeMe !== null) {
            console.log(excludeMe);
         } else {
            if (exclude !== null) {
               console.log(exclude);
               if (eligible !== null) {
                  console.log(eligible);
               }
            }
         }
         console.groupEnd();
      }

      self._send(msg);
   };


   // allow both 2-party and 3-party authentication/authorization
   // for 3-party: let C sign, but let both the B and C party authorize

   ab.Session.prototype.authreq = function (appkey, extra) {
      return this.call("http://api.wamp.ws/procedure#authreq", appkey, extra);
   };

   ab.Session.prototype.authsign = function (challenge, secret) {
      if (!secret) {
         secret = "";
      }

      return CryptoJS.HmacSHA256(challenge, secret).toString(CryptoJS.enc.Base64);
   };

   ab.Session.prototype.auth = function (signature) {
      return this.call("http://api.wamp.ws/procedure#auth", signature);
   };


   ab._connect = function (peer) {

      // establish session to WAMP server
      var sess = new ab.Session(peer.wsuri,

         // fired when session has been opened
         function() {

            peer.connects += 1;
            peer.retryCount = 0;

            // we are connected .. do awesome stuff!
            peer.onConnect(sess);
         },

         // fired when session has been closed
         function(code, reason) {

            var stop = null;

            switch (code) {

               case ab.CONNECTION_CLOSED:
                  // the session was closed by the app
                  peer.onHangup(code, "Connection was closed properly [" + reason + "]");
                  break;

               case ab.CONNECTION_UNSUPPORTED:
                  // fatal: we miss our WebSocket object!
                  peer.onHangup(code, "Browser does not support WebSocket.");
                  break;

               case ab.CONNECTION_UNREACHABLE:

                  peer.retryCount += 1;

                  if (peer.connects === 0) {

                     // the connection could not be established in the first place
                     // which likely means invalid server WS URI or such things
                     peer.onHangup(code, "Connection could not be established.");

                  } else {

                     // the connection was established at least once successfully,
                     // but now lost .. sane thing is to try automatic reconnects
                     if (peer.retryCount <= peer.options.maxRetries) {

                        // notify the app of scheduled reconnect
                        stop = peer.onHangup(ab.CONNECTION_UNREACHABLE_SCHEDULED_RECONNECT,
                                             "Connection unreachable - scheduled reconnect to occur in " + (peer.options.retryDelay / 1000) + " second(s) - attempt " + peer.retryCount + " of " + peer.options.maxRetries + ".",
                                             {delay: peer.options.retryDelay,
                                              retries: peer.retryCount,
                                              maxretries: peer.options.maxRetries});

                        if (!stop) {
                           if (ab._debugconnect) {
                               console.log("Connection unreachable - retrying (" + peer.retryCount + ") ..");
                           }
                           root.setTimeout(function () {
                                ab._connect(peer);
                            }, peer.options.retryDelay);
                        } else {
                           if (ab._debugconnect) {
                               console.log("Connection unreachable - retrying stopped by app");
                           }
                           peer.onHangup(ab.CONNECTION_RETRIES_EXCEEDED, "Number of connection retries exceeded.");
                        }

                     } else {
                        peer.onHangup(ab.CONNECTION_RETRIES_EXCEEDED, "Number of connection retries exceeded.");
                     }
                  }
                  break;

               case ab.CONNECTION_LOST:

                  peer.retryCount += 1;

                  if (peer.retryCount <= peer.options.maxRetries) {

                     // notify the app of scheduled reconnect
                     stop = peer.onHangup(ab.CONNECTION_LOST_SCHEDULED_RECONNECT,
                                          "Connection lost - scheduled " + peer.retryCount + "th reconnect to occur in " + (peer.options.retryDelay / 1000) + " second(s).",
                                          {delay: peer.options.retryDelay,
                                           retries: peer.retryCount,
                                           maxretries: peer.options.maxRetries});

                     if (!stop) {
                        if (ab._debugconnect) {
                            console.log("Connection lost - retrying (" + peer.retryCount + ") ..");
                        }
                        root.setTimeout(function () {
                                ab._connect(peer);
                            }, peer.options.retryDelay);
                     } else {
                        if (ab._debugconnect) {
                            console.log("Connection lost - retrying stopped by app");
                        }
                        peer.onHangup(ab.CONNECTION_RETRIES_EXCEEDED, "Connection lost.");
                     }
                  } else {
                     peer.onHangup(ab.CONNECTION_RETRIES_EXCEEDED, "Connection lost.");
                  }
                  break;

               default:
                  throw "unhandled close code in ab._connect";
            }
         },

         peer.options // forward options to session class for specific WS/WAMP options
      );
   };


   ab.connect = function (wsuri, onconnect, onhangup, options) {

      var peer = {};
      peer.wsuri = wsuri;

      if (!options) {
         peer.options = {};
      } else {
         peer.options = options;
      }

      if (peer.options.retryDelay === undefined) {
         peer.options.retryDelay = 5000;
      }

      if (peer.options.maxRetries === undefined) {
         peer.options.maxRetries = 10;
      }

      if (peer.options.skipSubprotocolCheck === undefined) {
         peer.options.skipSubprotocolCheck = false;
      }

      if (peer.options.skipSubprotocolAnnounce === undefined) {
         peer.options.skipSubprotocolAnnounce = false;
      }

      if (!onconnect) {
         throw "onConnect handler required!";
      } else {
         peer.onConnect = onconnect;
      }

      if (!onhangup) {
         peer.onHangup = function (code, reason, detail) {
            if (ab._debugconnect) {
                console.log(code, reason, detail);
            }
         };
      } else {
         peer.onHangup = onhangup;
      }

      peer.connects = 0; // total number of successful connects
      peer.retryCount = 0; // number of retries since last successful connect

      ab._connect(peer);
   };


   ab.launch = function (appConfig, onOpen, onClose) {

      function Rpc(session, uri) {
         return function() {
            var args = [uri];
            for (var j = 0; j < arguments.length; ++j) {
               args.push(arguments[j]);
            }
            //arguments.unshift(uri);
            return ab.Session.prototype.call.apply(session, args);
         };
      }

      function createApi(session, perms) {
         session.api = {};
         for (var i = 0; i < perms.rpc.length; ++i) {
            var uri = perms.rpc[i].uri;

            var _method = uri.split("#")[1];
            var _class = uri.split("#")[0].split("/");
            _class = _class[_class.length - 1];

            if (!(_class in session.api)) {
               session.api[_class] = {};
            }

            session.api[_class][_method] = new Rpc(session, uri);
         }
      }

      ab.connect(appConfig.wsuri,

         // connection established handler
         function (session) {
            if (!appConfig.appkey || appConfig.appkey === "") {
               // Authenticate as anonymous ..
               session.authreq().then(function () {
                  session.auth().then(function (permissions) {
                     //createApi(session, permissions);
                     if (onOpen) {
                        onOpen(session);
                     } else if (ab._debugconnect) {
                        session.log('Session opened.');
                     }
                  }, session.log);
               }, session.log);
            } else {
               // Authenticate as appkey ..
               session.authreq(appConfig.appkey, appConfig.appextra).then(function (challenge) {

                  var signature = null;

                  if (typeof(appConfig.appsecret) === 'function') {
                     signature = appConfig.appsecret(challenge);
                  } else {
                     // derive secret if salted WAMP-CRA
                     var secret = ab.deriveKey(appConfig.appsecret, JSON.parse(challenge).authextra);

                     // direct sign
                     signature = session.authsign(challenge, secret);
                  }

                  session.auth(signature).then(function (permissions) {
                     //createApi(session, permissions);
                     if (onOpen) {
                        onOpen(session);
                     } else if (ab._debugconnect) {
                        session.log('Session opened.');
                     }
                  }, session.log);
               }, session.log);
            }
         },

         // connection lost handler
         function (code, reason, detail) {
            if (onClose) {
               onClose(code, reason, detail);
            } else if (ab._debugconnect) {
               ab.log('Session closed.', code, reason, detail);
            }
         },

         // WAMP session config
         appConfig.sessionConfig
      );
   };

   return ab;
}));
