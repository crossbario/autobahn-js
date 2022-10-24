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

let HAS_WHEN;
let when;
try {
   when = require('when');
   HAS_WHEN = true;
} catch (e) {
   HAS_WHEN = false;
}

let log = require('./log.js');


/// Convert base64 string to array of bytes.
function _atob (s) {
   if (s) {
      return new Uint8Array(atob(s).split("").map(function(c) { return c.charCodeAt(0); }));
   } else {
      return null;
   }
}

exports.atob = _atob


/// Convert array of bytes to base64 string.
function _btoa (b) {
   if (b) {
      return  btoa(String.fromCharCode.apply(null, b));
   } else {
      return null;
   }
}

exports.btoa = _btoa


/// Convert array of bytes to hex string.
function _btoh (bytes) {
   if (bytes) {
      let res = '';
      for (let i = 0; i < bytes.length; ++i) {
         res += ('0' + (bytes[i] & 0xFF).toString(16)).slice(-2);
      }
      return res;
   } else {
      return null;
   }
}

exports.btoh = _btoh


/// Convert hex string to array of bytes.
function _htob (hex) {
   if (hex) {
      if (typeof hex !== 'string') {
         throw new TypeError('Expected input to be a string')
      }

      if ((hex.length % 2) !== 0) {
         throw new RangeError('Expected string to be an even number of characters')
      }

      let view = new Uint8Array(hex.length / 2)

      for (let i = 0; i < hex.length; i += 2) {
         view[i / 2] = parseInt(hex.substring(i, i + 2), 16)
      }

      return view
   } else {
      return null;
   }
}

exports.htob = _htob


let rand_normal = function (mean, sd) {
   // Derive a Gaussian from Uniform random variables
   // http://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
   let x1, x2, rad;

   do {
      x1 = 2 * Math.random() - 1;
      x2 = 2 * Math.random() - 1;
      rad = x1 * x1 + x2 * x2;
   } while (rad >= 1 || rad == 0);

   let c = Math.sqrt(-2 * Math.log(rad) / rad);

   return (mean || 0) + (x1 * c) * (sd || 1);
};


let is_object = function(variable) {
   return !Array.isArray(variable) && (variable instanceof Object || typeof variable === 'object')
};


let assert = function (cond, text) {
	if (cond) {
      return;
   }
	if (assert.useDebugger || ('AUTOBAHN_DEBUG' in global && AUTOBAHN_DEBUG)) {
      debugger;
   }

	throw new Error(text || "Assertion failed!");
};



// Helper to do HTTP/POST requests returning deferreds. This function is
// supposed to work on IE8, IE9 and old Android WebKit browsers. We don't care
// if it works with other browsers.
//
let http_post = function (url, data, timeout) {

   log.debug("new http_post request", url, data, timeout);

   let factory = deferred_factory();
   let d = factory();
   let req = new XMLHttpRequest();
   req.withCredentials = true; // pass along cookies
   req.onreadystatechange = function () {

      if (req.readyState === 4) {

         // Normalize IE's response to HTTP 204 when Win error 1223.
         // http://stackoverflow.com/a/10047236/884770
         //
         let status = (req.status === 1223) ? 204 : req.status;

         if (status === 200) {

            // response with content
            //
            d.resolve(req.responseText);

         } if (status === 204) {

            // empty response
            //
            d.resolve();

         } else {

            // anything else is a fail
            //
            let statusText = null;
            try {
               statusText = req.statusText;
            } catch (e) {
               // IE8 fucks up on this
            }
            d.reject({code: status, text: statusText});
         }
      }
   }

   req.open("POST", url, true);
   req.setRequestHeader("Content-type", "application/json; charset=utf-8");

   if (timeout > 0) {
      req.timeout = timeout; // request timeout in ms

      req.ontimeout = function () {
         d.reject({code: 501, text: "request timeout"});
      }
   }

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

// Helper to do HTTP/GET requests returning JSON parsed result as a promise.
let http_get_json = function (url, timeout) {

   let factory = deferred_factory();
   let d = factory();
   let req = new XMLHttpRequest();
   req.withCredentials = true; // pass along cookies
   req.onreadystatechange = function () {

      if (req.readyState === 4) {

         // Normalize IE's response to HTTP 204 when Win error 1223.
         // http://stackoverflow.com/a/10047236/884770
         //
         let status = (req.status === 1223) ? 204 : req.status;

         if (status === 200) {

            // parse response
            let data = JSON.parse(req.responseText);

            // response with content
            //
            d.resolve(data);

         } if (status === 204) {

            // empty response
            //
            d.resolve();

         } else {

            // anything else is a fail
            //
            let statusText = null;
            try {
               statusText = req.statusText;
            } catch (e) {
               // IE8 fucks up on this
            }
            d.reject({code: status, text: statusText});
         }
      }
   }

   req.open("GET", url, true);
   req.setRequestHeader("Content-type", "application/json; charset=utf-8");

   if (timeout > 0) {
      req.timeout = timeout; // request timeout in ms

      req.ontimeout = function () {
         d.reject({code: 501, text: "request timeout"});
      }
   }

   req.send();

   if (d.promise.then) {
      // whenjs has the actual user promise in an attribute
      return d.promise;
   } else {
      return d;
   }
};

/**
 * Merge a list of objects from left to right
 *
 * For each object passed to the function, add to the previous object the keys
 *     that are present in the former but not the latter. If the last argument
 *     is a boolean, it sets whether or not to recursively merge objects.
 *
 * This function mutates the first passed object. To avopid this, you can pass
 *     a new empty object as the first arg:
 *
 *     defaults({}, obj1, obj2, ...)
 *
 * @example
 *     defaults({ a: 1 }, { a: 2, b: 2 }, { b: 3, c: 3 })
 *     // { a: 1, b: 2, c: 3 }
 *
 *     defaults({ a: { k1: 1 } }, { a: { k2: 2 } })
 *     // { a: { k1: 1 } }
 *
 *     defaults({ a: { k1: 1 } }, { a: { k2: 2 } })
 *     // { a: { k1: 1 } }
 *
 * @param {Object} base The object to merge defaults to
 * @param {Object} source[, ...] The default values source
 * @param {Boolean} [recursive] Whether to recurse fro object values*
 *     (default: false)
 * @returns {Object} The mutated `base` object
 */
let defaults = function () {
   // Return an empty object if no arguments are passed
   if (arguments.length === 0) return {};

   let base = arguments[0];
   let recursive = false;
   let len = arguments.length;

   // Check for recursive mode param
   if (typeof arguments[len - 1] === 'boolean') {
      recursive = arguments[len - 1];
      len -= 1; // Ignore the last arg
   }

   // Iterate over source objects
   for (let i=1; i < len; i++) {
      let obj = arguments[i];

      // Ignore falsy values
      if (!obj) continue;

      // Require object
      if (typeof obj !== 'object') {
         throw new Error('Expected argument at index ' + i +
                         ' to be an object');
      }

      // Merging function used by Array#forEach()
      let do_merge = function (key) {

         let val = obj[key];

         // Set if unset
         if (!(key in base)) {
            base[key] = val;
            // If the value is an object and we use recursive mode, use defaults on
            // the value
         } else if (recursive && typeof val === 'object' &&
             typeof base[key] === 'object') {
            defaults(base[key], val);
         }
         // Otherwise ignore the value
      };

      // Merge keys
      Object.keys(obj).forEach(do_merge);
   }

   // Return the mutated base object
   return base;
};

/**
 * If an error handler function is given, it is called with the error instance, otherwise log the error to the console
 * with a possible custom error message prefix. The custom message is passed also the error handler.
 *
 * @param {function} handler - The error handler function.
 * @param {object | Error} error - The error instance.
 * @param {string} [error_message] - The custom error message, optional.
 */
let handle_error = function(handler, error, error_message) {
    if(typeof handler === 'function') {
        handler(error, error_message);
    } else {
        console.error(error_message || 'Unhandled exception raised: ', error);
    }
};

/**
 * Generate a new ID to identify a WAMP global scope entity, such as a session or a publication.
 * Represented as a JavaScript Number (double float), so ensure that an appropriate serialization
 * for an integer is used for use in transported WAMP protocol messages.
 */
let new_global_id = function() {
    return Math.floor(Math.random() * 9007199254740992) + 1;
};

let deferred_factory = function(options) {
   let defer;

   // Our strategy is to default to whenjs-based promise if a promise
   // preference is not provided *and* whenjs is available.
   // In the absence of whenjs and promise preference, we
   // use the ES6 Promise because we are ES6+ so always expect
   // that to be available.

   let get_es6_promise_factory = function () {
      return function () {
         let deferred = {};

         deferred.promise = new Promise(function (resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
         });

         return deferred;
      };
   }

   if (options) {
      if (options.use_es6_promises) {

         // ES6-based deferred factory
         //
         defer = get_es6_promise_factory();

      } else if (options.use_deferred) {

         // use explicit deferred factory, e.g. jQuery.Deferred or Q.defer
         //
         defer = options.use_deferred;

      } else if (HAS_WHEN) {

         // whenjs-based deferred factory
         //
         defer = when.defer;

      } else {

         // ES6-based deferred factory
         //
         defer = get_es6_promise_factory();

      }
   } else if (HAS_WHEN) {

      // whenjs-based deferred factory
      //
      defer = when.defer;

   } else {

      // ES6-based deferred factory
      //
      defer = get_es6_promise_factory();

   }

   return defer;
};

let promise = function(d) {
   if (d.promise.then) {
      // whenjs has the actual user promise in an attribute
      return d.promise;
   } else {
      return d;
   }
};

let sleep = async function sleep (ms) {
   return new Promise(resolve => setTimeout(resolve, ms));
};

let _read_file = async function read_file (path) {
   return new Promise((resolve, reject) => {
      fs.readFile(path, function (err, data) {
         if (err) {
            reject(err);
         } else {
            resolve(data);
         }
      });
   });
};

let as_promise = function (func, ...args) {
   return new Promise((resolve, reject) => {
      try {
         resolve(func.call(this, ...args));
      } catch (e) {
         reject(e);
      }
   });
}

if ('fs' in global) {
   exports.read_file = _read_file;
} else {
   exports.read_file = null;
}

exports.handle_error = handle_error;
exports.rand_normal = rand_normal;
exports.is_object = is_object;
exports.assert = assert;
exports.http_post = http_post;
exports.http_get_json = http_get_json;
exports.defaults = defaults;
exports.new_global_id = new_global_id;
exports.deferred_factory = deferred_factory;
exports.promise = promise;
exports.sleep = sleep;
exports.as_promise = as_promise;
