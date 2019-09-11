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

var assert = require('assert');
var when = require('when');
var web3 = require('web3');
var BN = web3.utils.BN;

var log = require('./log.js');


var deferred_factory = function(options) {
    var defer = null;

    if (options && options.use_es6_promises) {

        if ('Promise' in global) {
            // ES6-based deferred factory
            //
            defer = function () {
                var deferred = {};

                deferred.promise = new Promise(function (resolve, reject) {
                    deferred.resolve = resolve;
                    deferred.reject = reject;
                });

                return deferred;
            };
        } else {

            log.debug("Warning: ES6 promises requested, but not found! Falling back to whenjs.");

            // whenjs-based deferred factory
            //
            defer = when.defer;
        }

    } else if (options && options.use_deferred) {

        // use explicit deferred factory, e.g. jQuery.Deferred or Q.defer
        //
        defer = options.use_deferred;

    } else {

        // whenjs-based deferred factory
        //
        defer = when.defer;
    }

    return defer;
};


var promise = function(d) {
    if (d.promise.then) {
        // whenjs has the actual user promise in an attribute
        return d.promise;
    } else {
        return d;
    }
};


function pack_uint256 (value) {
    assert(BN.isBN(value));

    // if (typeof Buffer !== 'undefined') {
    if (global.process && global.process.versions.node) {
        // running on Node
        return value.toBuffer('be', 32);
    } else {
        // running in Browser
        /*
            https://github.com/indutny/bn.js/issues/147
            https://github.com/browserify/insert-module-globals
            https://github.com/browserify/browserify#compatibility

            we need Buffer, because of the following assert in BN:

            BN.prototype.toBuffer = function toBuffer (endian, length) {
                assert(typeof Buffer !== 'undefined');
                return this.toArrayLike(Buffer, endian, length);
            };
        */
        return new Uint8Array(value.toArray('be', 32));
    }
}


exports.deferred_factory = deferred_factory;
exports.promise = promise;
exports.pack_uint256 = pack_uint256;
