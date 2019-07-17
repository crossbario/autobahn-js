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

var log = require('./log.js');

var when = require('when');

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


exports.deferred_factory = deferred_factory;
exports.promise = promise;
