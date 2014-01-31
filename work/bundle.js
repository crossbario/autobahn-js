(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){
(function (process){/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * A lightweight CommonJS Promises/A and when() implementation
 * when is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 * @version 2.7.1
 */
(function(define) { 'use strict';
define(function (require) {

	// Public API

	when.promise   = promise;    // Create a pending promise
	when.resolve   = resolve;    // Create a resolved promise
	when.reject    = reject;     // Create a rejected promise
	when.defer     = defer;      // Create a {promise, resolver} pair

	when.join      = join;       // Join 2 or more promises

	when.all       = all;        // Resolve a list of promises
	when.map       = map;        // Array.map() for promises
	when.reduce    = reduce;     // Array.reduce() for promises
	when.settle    = settle;     // Settle a list of promises

	when.any       = any;        // One-winner race
	when.some      = some;       // Multi-winner race

	when.isPromise = isPromiseLike;  // DEPRECATED: use isPromiseLike
	when.isPromiseLike = isPromiseLike; // Is something promise-like, aka thenable

	/**
	 * Register an observer for a promise or immediate value.
	 *
	 * @param {*} promiseOrValue
	 * @param {function?} [onFulfilled] callback to be called when promiseOrValue is
	 *   successfully fulfilled.  If promiseOrValue is an immediate value, callback
	 *   will be invoked immediately.
	 * @param {function?} [onRejected] callback to be called when promiseOrValue is
	 *   rejected.
	 * @param {function?} [onProgress] callback to be called when progress updates
	 *   are issued for promiseOrValue.
	 * @returns {Promise} a new {@link Promise} that will complete with the return
	 *   value of callback or errback or the completion value of promiseOrValue if
	 *   callback and/or errback is not supplied.
	 */
	function when(promiseOrValue, onFulfilled, onRejected, onProgress) {
		// Get a trusted promise for the input promiseOrValue, and then
		// register promise handlers
		return cast(promiseOrValue).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Creates a new promise whose fate is determined by resolver.
	 * @param {function} resolver function(resolve, reject, notify)
	 * @returns {Promise} promise whose fate is determine by resolver
	 */
	function promise(resolver) {
		return new Promise(resolver,
			monitorApi.PromiseStatus && monitorApi.PromiseStatus());
	}

	/**
	 * Trusted Promise constructor.  A Promise created from this constructor is
	 * a trusted when.js promise.  Any other duck-typed promise is considered
	 * untrusted.
	 * @constructor
	 * @returns {Promise} promise whose fate is determine by resolver
	 * @name Promise
	 */
	function Promise(resolver, status) {
		var self, value, consumers = [];

		self = this;
		this._status = status;
		this.inspect = inspect;
		this._when = _when;

		// Call the provider resolver to seal the promise's fate
		try {
			resolver(promiseResolve, promiseReject, promiseNotify);
		} catch(e) {
			promiseReject(e);
		}

		/**
		 * Returns a snapshot of this promise's current status at the instant of call
		 * @returns {{state:String}}
		 */
		function inspect() {
			return value ? value.inspect() : toPendingState();
		}

		/**
		 * Private message delivery. Queues and delivers messages to
		 * the promise's ultimate fulfillment value or rejection reason.
		 * @private
		 */
		function _when(resolve, notify, onFulfilled, onRejected, onProgress) {
			consumers ? consumers.push(deliver) : enqueue(function() { deliver(value); });

			function deliver(p) {
				p._when(resolve, notify, onFulfilled, onRejected, onProgress);
			}
		}

		/**
		 * Transition from pre-resolution state to post-resolution state, notifying
		 * all listeners of the ultimate fulfillment or rejection
		 * @param {*} val resolution value
		 */
		function promiseResolve(val) {
			if(!consumers) {
				return;
			}

			var queue = consumers;
			consumers = undef;

			enqueue(function () {
				value = coerce(self, val);
				if(status) {
					updateStatus(value, status);
				}
				runHandlers(queue, value);
			});
		}

		/**
		 * Reject this promise with the supplied reason, which will be used verbatim.
		 * @param {*} reason reason for the rejection
		 */
		function promiseReject(reason) {
			promiseResolve(new RejectedPromise(reason));
		}

		/**
		 * Issue a progress event, notifying all progress listeners
		 * @param {*} update progress event payload to pass to all listeners
		 */
		function promiseNotify(update) {
			if(consumers) {
				var queue = consumers;
				enqueue(function () {
					runHandlers(queue, new ProgressingPromise(update));
				});
			}
		}
	}

	promisePrototype = Promise.prototype;

	/**
	 * Register handlers for this promise.
	 * @param [onFulfilled] {Function} fulfillment handler
	 * @param [onRejected] {Function} rejection handler
	 * @param [onProgress] {Function} progress handler
	 * @return {Promise} new Promise
	 */
	promisePrototype.then = function(onFulfilled, onRejected, onProgress) {
		var self = this;

		return new Promise(function(resolve, reject, notify) {
			self._when(resolve, notify, onFulfilled, onRejected, onProgress);
		}, this._status && this._status.observed());
	};

	/**
	 * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
	 * @param {function?} onRejected
	 * @return {Promise}
	 */
	promisePrototype['catch'] = promisePrototype.otherwise = function(onRejected) {
		return this.then(undef, onRejected);
	};

	/**
	 * Ensures that onFulfilledOrRejected will be called regardless of whether
	 * this promise is fulfilled or rejected.  onFulfilledOrRejected WILL NOT
	 * receive the promises' value or reason.  Any returned value will be disregarded.
	 * onFulfilledOrRejected may throw or return a rejected promise to signal
	 * an additional error.
	 * @param {function} onFulfilledOrRejected handler to be called regardless of
	 *  fulfillment or rejection
	 * @returns {Promise}
	 */
	promisePrototype['finally'] = promisePrototype.ensure = function(onFulfilledOrRejected) {
		return typeof onFulfilledOrRejected === 'function'
			? this.then(injectHandler, injectHandler)['yield'](this)
			: this;

		function injectHandler() {
			return resolve(onFulfilledOrRejected());
		}
	};

	/**
	 * Terminate a promise chain by handling the ultimate fulfillment value or
	 * rejection reason, and assuming responsibility for all errors.  if an
	 * error propagates out of handleResult or handleFatalError, it will be
	 * rethrown to the host, resulting in a loud stack track on most platforms
	 * and a crash on some.
	 * @param {function?} handleResult
	 * @param {function?} handleError
	 * @returns {undefined}
	 */
	promisePrototype.done = function(handleResult, handleError) {
		this.then(handleResult, handleError)['catch'](crash);
	};

	/**
	 * Shortcut for .then(function() { return value; })
	 * @param  {*} value
	 * @return {Promise} a promise that:
	 *  - is fulfilled if value is not a promise, or
	 *  - if value is a promise, will fulfill with its value, or reject
	 *    with its reason.
	 */
	promisePrototype['yield'] = function(value) {
		return this.then(function() {
			return value;
		});
	};

	/**
	 * Runs a side effect when this promise fulfills, without changing the
	 * fulfillment value.
	 * @param {function} onFulfilledSideEffect
	 * @returns {Promise}
	 */
	promisePrototype.tap = function(onFulfilledSideEffect) {
		return this.then(onFulfilledSideEffect)['yield'](this);
	};

	/**
	 * Assumes that this promise will fulfill with an array, and arranges
	 * for the onFulfilled to be called with the array as its argument list
	 * i.e. onFulfilled.apply(undefined, array).
	 * @param {function} onFulfilled function to receive spread arguments
	 * @return {Promise}
	 */
	promisePrototype.spread = function(onFulfilled) {
		return this.then(function(array) {
			// array may contain promises, so resolve its contents.
			return all(array, function(array) {
				return onFulfilled.apply(undef, array);
			});
		});
	};

	/**
	 * Shortcut for .then(onFulfilledOrRejected, onFulfilledOrRejected)
	 * @deprecated
	 */
	promisePrototype.always = function(onFulfilledOrRejected, onProgress) {
		return this.then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress);
	};

	/**
	 * Casts x to a trusted promise. If x is already a trusted promise, it is
	 * returned, otherwise a new trusted Promise which follows x is returned.
	 * @param {*} x
	 * @returns {Promise}
	 */
	function cast(x) {
		return x instanceof Promise ? x : resolve(x);
	}

	/**
	 * Returns a resolved promise. The returned promise will be
	 *  - fulfilled with promiseOrValue if it is a value, or
	 *  - if promiseOrValue is a promise
	 *    - fulfilled with promiseOrValue's value after it is fulfilled
	 *    - rejected with promiseOrValue's reason after it is rejected
	 * In contract to cast(x), this always creates a new Promise
	 * @param  {*} value
	 * @return {Promise}
	 */
	function resolve(value) {
		return promise(function(resolve) {
			resolve(value);
		});
	}

	/**
	 * Returns a rejected promise for the supplied promiseOrValue.  The returned
	 * promise will be rejected with:
	 * - promiseOrValue, if it is a value, or
	 * - if promiseOrValue is a promise
	 *   - promiseOrValue's value after it is fulfilled
	 *   - promiseOrValue's reason after it is rejected
	 * @param {*} promiseOrValue the rejected value of the returned {@link Promise}
	 * @return {Promise} rejected {@link Promise}
	 */
	function reject(promiseOrValue) {
		return when(promiseOrValue, function(e) {
			return new RejectedPromise(e);
		});
	}

	/**
	 * Creates a {promise, resolver} pair, either or both of which
	 * may be given out safely to consumers.
	 * The resolver has resolve, reject, and progress.  The promise
	 * has then plus extended promise API.
	 *
	 * @return {{
	 * promise: Promise,
	 * resolve: function:Promise,
	 * reject: function:Promise,
	 * notify: function:Promise
	 * resolver: {
	 *	resolve: function:Promise,
	 *	reject: function:Promise,
	 *	notify: function:Promise
	 * }}}
	 */
	function defer() {
		var deferred, pending, resolved;

		// Optimize object shape
		deferred = {
			promise: undef, resolve: undef, reject: undef, notify: undef,
			resolver: { resolve: undef, reject: undef, notify: undef }
		};

		deferred.promise = pending = promise(makeDeferred);

		return deferred;

		function makeDeferred(resolvePending, rejectPending, notifyPending) {
			deferred.resolve = deferred.resolver.resolve = function(value) {
				if(resolved) {
					return resolve(value);
				}
				resolved = true;
				resolvePending(value);
				return pending;
			};

			deferred.reject  = deferred.resolver.reject  = function(reason) {
				if(resolved) {
					return resolve(new RejectedPromise(reason));
				}
				resolved = true;
				rejectPending(reason);
				return pending;
			};

			deferred.notify  = deferred.resolver.notify  = function(update) {
				notifyPending(update);
				return update;
			};
		}
	}

	/**
	 * Run a queue of functions as quickly as possible, passing
	 * value to each.
	 */
	function runHandlers(queue, value) {
		for (var i = 0; i < queue.length; i++) {
			queue[i](value);
		}
	}

	/**
	 * Coerces x to a trusted Promise
	 * @param {*} x thing to coerce
	 * @returns {*} Guaranteed to return a trusted Promise.  If x
	 *   is trusted, returns x, otherwise, returns a new, trusted, already-resolved
	 *   Promise whose resolution value is:
	 *   * the resolution value of x if it's a foreign promise, or
	 *   * x if it's a value
	 */
	function coerce(self, x) {
		if (x === self) {
			return new RejectedPromise(new TypeError());
		}

		if (x instanceof Promise) {
			return x;
		}

		try {
			var untrustedThen = x === Object(x) && x.then;

			return typeof untrustedThen === 'function'
				? assimilate(untrustedThen, x)
				: new FulfilledPromise(x);
		} catch(e) {
			return new RejectedPromise(e);
		}
	}

	/**
	 * Safely assimilates a foreign thenable by wrapping it in a trusted promise
	 * @param {function} untrustedThen x's then() method
	 * @param {object|function} x thenable
	 * @returns {Promise}
	 */
	function assimilate(untrustedThen, x) {
		return promise(function (resolve, reject) {
			fcall(untrustedThen, x, resolve, reject);
		});
	}

	makePromisePrototype = Object.create ||
		function(o) {
			function PromisePrototype() {}
			PromisePrototype.prototype = o;
			return new PromisePrototype();
		};

	/**
	 * Creates a fulfilled, local promise as a proxy for a value
	 * NOTE: must never be exposed
	 * @private
	 * @param {*} value fulfillment value
	 * @returns {Promise}
	 */
	function FulfilledPromise(value) {
		this.value = value;
	}

	FulfilledPromise.prototype = makePromisePrototype(promisePrototype);

	FulfilledPromise.prototype.inspect = function() {
		return toFulfilledState(this.value);
	};

	FulfilledPromise.prototype._when = function(resolve, _, onFulfilled) {
		try {
			resolve(typeof onFulfilled === 'function' ? onFulfilled(this.value) : this.value);
		} catch(e) {
			resolve(new RejectedPromise(e));
		}
	};

	/**
	 * Creates a rejected, local promise as a proxy for a value
	 * NOTE: must never be exposed
	 * @private
	 * @param {*} reason rejection reason
	 * @returns {Promise}
	 */
	function RejectedPromise(reason) {
		this.value = reason;
	}

	RejectedPromise.prototype = makePromisePrototype(promisePrototype);

	RejectedPromise.prototype.inspect = function() {
		return toRejectedState(this.value);
	};

	RejectedPromise.prototype._when = function(resolve, _, __, onRejected) {
		try {
			resolve(typeof onRejected === 'function' ? onRejected(this.value) : this);
		} catch(e) {
			resolve(new RejectedPromise(e));
		}
	};

	/**
	 * Create a progress promise with the supplied update.
	 * @private
	 * @param {*} value progress update value
	 * @return {Promise} progress promise
	 */
	function ProgressingPromise(value) {
		this.value = value;
	}

	ProgressingPromise.prototype = makePromisePrototype(promisePrototype);

	ProgressingPromise.prototype._when = function(_, notify, f, r, u) {
		try {
			notify(typeof u === 'function' ? u(this.value) : this.value);
		} catch(e) {
			notify(e);
		}
	};

	/**
	 * Update a PromiseStatus monitor object with the outcome
	 * of the supplied value promise.
	 * @param {Promise} value
	 * @param {PromiseStatus} status
	 */
	function updateStatus(value, status) {
		value.then(statusFulfilled, statusRejected);

		function statusFulfilled() { status.fulfilled(); }
		function statusRejected(r) { status.rejected(r); }
	}

	/**
	 * Determines if x is promise-like, i.e. a thenable object
	 * NOTE: Will return true for *any thenable object*, and isn't truly
	 * safe, since it may attempt to access the `then` property of x (i.e.
	 *  clever/malicious getters may do weird things)
	 * @param {*} x anything
	 * @returns {boolean} true if x is promise-like
	 */
	function isPromiseLike(x) {
		return x && typeof x.then === 'function';
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * howMany of the supplied promisesOrValues have resolved, or will reject when
	 * it becomes impossible for howMany to resolve, for example, when
	 * (promisesOrValues.length - howMany) + 1 input promises reject.
	 *
	 * @param {Array} promisesOrValues array of anything, may contain a mix
	 *      of promises and values
	 * @param howMany {number} number of promisesOrValues to resolve
	 * @param {function?} [onFulfilled] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onRejected] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onProgress] DEPRECATED, use returnedPromise.then()
	 * @returns {Promise} promise that will resolve to an array of howMany values that
	 *  resolved first, or will reject with an array of
	 *  (promisesOrValues.length - howMany) + 1 rejection reasons.
	 */
	function some(promisesOrValues, howMany, onFulfilled, onRejected, onProgress) {

		return when(promisesOrValues, function(promisesOrValues) {

			return promise(resolveSome).then(onFulfilled, onRejected, onProgress);

			function resolveSome(resolve, reject, notify) {
				var toResolve, toReject, values, reasons, fulfillOne, rejectOne, len, i;

				len = promisesOrValues.length >>> 0;

				toResolve = Math.max(0, Math.min(howMany, len));
				values = [];

				toReject = (len - toResolve) + 1;
				reasons = [];

				// No items in the input, resolve immediately
				if (!toResolve) {
					resolve(values);

				} else {
					rejectOne = function(reason) {
						reasons.push(reason);
						if(!--toReject) {
							fulfillOne = rejectOne = identity;
							reject(reasons);
						}
					};

					fulfillOne = function(val) {
						// This orders the values based on promise resolution order
						values.push(val);
						if (!--toResolve) {
							fulfillOne = rejectOne = identity;
							resolve(values);
						}
					};

					for(i = 0; i < len; ++i) {
						if(i in promisesOrValues) {
							when(promisesOrValues[i], fulfiller, rejecter, notify);
						}
					}
				}

				function rejecter(reason) {
					rejectOne(reason);
				}

				function fulfiller(val) {
					fulfillOne(val);
				}
			}
		});
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * any one of the supplied promisesOrValues has resolved or will reject when
	 * *all* promisesOrValues have rejected.
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onRejected] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onProgress] DEPRECATED, use returnedPromise.then()
	 * @returns {Promise} promise that will resolve to the value that resolved first, or
	 * will reject with an array of all rejected inputs.
	 */
	function any(promisesOrValues, onFulfilled, onRejected, onProgress) {

		function unwrapSingleResult(val) {
			return onFulfilled ? onFulfilled(val[0]) : val[0];
		}

		return some(promisesOrValues, 1, unwrapSingleResult, onRejected, onProgress);
	}

	/**
	 * Return a promise that will resolve only once all the supplied promisesOrValues
	 * have resolved. The resolution value of the returned promise will be an array
	 * containing the resolution values of each of the promisesOrValues.
	 * @memberOf when
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onRejected] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onProgress] DEPRECATED, use returnedPromise.then()
	 * @returns {Promise}
	 */
	function all(promisesOrValues, onFulfilled, onRejected, onProgress) {
		return _map(promisesOrValues, identity).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Joins multiple promises into a single returned promise.
	 * @return {Promise} a promise that will fulfill when *all* the input promises
	 * have fulfilled, or will reject when *any one* of the input promises rejects.
	 */
	function join(/* ...promises */) {
		return _map(arguments, identity);
	}

	/**
	 * Settles all input promises such that they are guaranteed not to
	 * be pending once the returned promise fulfills. The returned promise
	 * will always fulfill, except in the case where `array` is a promise
	 * that rejects.
	 * @param {Array|Promise} array or promise for array of promises to settle
	 * @returns {Promise} promise that always fulfills with an array of
	 *  outcome snapshots for each input promise.
	 */
	function settle(array) {
		return _map(array, toFulfilledState, toRejectedState);
	}

	/**
	 * Promise-aware array map function, similar to `Array.prototype.map()`,
	 * but input array may contain promises or values.
	 * @param {Array|Promise} array array of anything, may contain promises and values
	 * @param {function} mapFunc map function which may return a promise or value
	 * @returns {Promise} promise that will fulfill with an array of mapped values
	 *  or reject if any input promise rejects.
	 */
	function map(array, mapFunc) {
		return _map(array, mapFunc);
	}

	/**
	 * Internal map that allows a fallback to handle rejections
	 * @param {Array|Promise} array array of anything, may contain promises and values
	 * @param {function} mapFunc map function which may return a promise or value
	 * @param {function?} fallback function to handle rejected promises
	 * @returns {Promise} promise that will fulfill with an array of mapped values
	 *  or reject if any input promise rejects.
	 */
	function _map(array, mapFunc, fallback) {
		return when(array, function(array) {

			return new Promise(resolveMap);

			function resolveMap(resolve, reject, notify) {
				var results, len, toResolve, i;

				// Since we know the resulting length, we can preallocate the results
				// array to avoid array expansions.
				toResolve = len = array.length >>> 0;
				results = [];

				if(!toResolve) {
					resolve(results);
					return;
				}

				// Since mapFunc may be async, get all invocations of it into flight
				for(i = 0; i < len; i++) {
					if(i in array) {
						resolveOne(array[i], i);
					} else {
						--toResolve;
					}
				}

				function resolveOne(item, i) {
					when(item, mapFunc, fallback).then(function(mapped) {
						results[i] = mapped;

						if(!--toResolve) {
							resolve(results);
						}
					}, reject, notify);
				}
			}
		});
	}

	/**
	 * Traditional reduce function, similar to `Array.prototype.reduce()`, but
	 * input may contain promises and/or values, and reduceFunc
	 * may return either a value or a promise, *and* initialValue may
	 * be a promise for the starting value.
	 *
	 * @param {Array|Promise} promise array or promise for an array of anything,
	 *      may contain a mix of promises and values.
	 * @param {function} reduceFunc reduce function reduce(currentValue, nextValue, index, total),
	 *      where total is the total number of items being reduced, and will be the same
	 *      in each call to reduceFunc.
	 * @returns {Promise} that will resolve to the final reduced value
	 */
	function reduce(promise, reduceFunc /*, initialValue */) {
		var args = fcall(slice, arguments, 1);

		return when(promise, function(array) {
			var total;

			total = array.length;

			// Wrap the supplied reduceFunc with one that handles promises and then
			// delegates to the supplied.
			args[0] = function (current, val, i) {
				return when(current, function (c) {
					return when(val, function (value) {
						return reduceFunc(c, value, i, total);
					});
				});
			};

			return reduceArray.apply(array, args);
		});
	}

	// Snapshot states

	/**
	 * Creates a fulfilled state snapshot
	 * @private
	 * @param {*} x any value
	 * @returns {{state:'fulfilled',value:*}}
	 */
	function toFulfilledState(x) {
		return { state: 'fulfilled', value: x };
	}

	/**
	 * Creates a rejected state snapshot
	 * @private
	 * @param {*} x any reason
	 * @returns {{state:'rejected',reason:*}}
	 */
	function toRejectedState(x) {
		return { state: 'rejected', reason: x };
	}

	/**
	 * Creates a pending state snapshot
	 * @private
	 * @returns {{state:'pending'}}
	 */
	function toPendingState() {
		return { state: 'pending' };
	}

	//
	// Internals, utilities, etc.
	//

	var promisePrototype, makePromisePrototype, reduceArray, slice, fcall, nextTick, handlerQueue,
		funcProto, call, arrayProto, monitorApi,
		capturedSetTimeout, cjsRequire, MutationObs, undef;

	cjsRequire = require;

	//
	// Shared handler queue processing
	//
	// Credit to Twisol (https://github.com/Twisol) for suggesting
	// this type of extensible queue + trampoline approach for
	// next-tick conflation.

	handlerQueue = [];

	/**
	 * Enqueue a task. If the queue is not currently scheduled to be
	 * drained, schedule it.
	 * @param {function} task
	 */
	function enqueue(task) {
		if(handlerQueue.push(task) === 1) {
			nextTick(drainQueue);
		}
	}

	/**
	 * Drain the handler queue entirely, being careful to allow the
	 * queue to be extended while it is being processed, and to continue
	 * processing until it is truly empty.
	 */
	function drainQueue() {
		runHandlers(handlerQueue);
		handlerQueue = [];
	}

	// Allow attaching the monitor to when() if env has no console
	monitorApi = typeof console !== 'undefined' ? console : when;

	// Sniff "best" async scheduling option
	// Prefer process.nextTick or MutationObserver, then check for
	// vertx and finally fall back to setTimeout
	/*global process,document,setTimeout,MutationObserver,WebKitMutationObserver*/
	if (typeof process === 'object' && process.nextTick) {
		nextTick = process.nextTick;
	} else if(MutationObs =
		(typeof MutationObserver === 'function' && MutationObserver) ||
			(typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)) {
		nextTick = (function(document, MutationObserver, drainQueue) {
			var el = document.createElement('div');
			new MutationObserver(drainQueue).observe(el, { attributes: true });

			return function() {
				el.setAttribute('x', 'x');
			};
		}(document, MutationObs, drainQueue));
	} else {
		try {
			// vert.x 1.x || 2.x
			nextTick = cjsRequire('vertx').runOnLoop || cjsRequire('vertx').runOnContext;
		} catch(ignore) {
			// capture setTimeout to avoid being caught by fake timers
			// used in time based tests
			capturedSetTimeout = setTimeout;
			nextTick = function(t) { capturedSetTimeout(t, 0); };
		}
	}

	//
	// Capture/polyfill function and array utils
	//

	// Safe function calls
	funcProto = Function.prototype;
	call = funcProto.call;
	fcall = funcProto.bind
		? call.bind(call)
		: function(f, context) {
			return f.apply(context, slice.call(arguments, 2));
		};

	// Safe array ops
	arrayProto = [];
	slice = arrayProto.slice;

	// ES5 reduce implementation if native not available
	// See: http://es5.github.com/#x15.4.4.21 as there are many
	// specifics and edge cases.  ES5 dictates that reduce.length === 1
	// This implementation deviates from ES5 spec in the following ways:
	// 1. It does not check if reduceFunc is a Callable
	reduceArray = arrayProto.reduce ||
		function(reduceFunc /*, initialValue */) {
			/*jshint maxcomplexity: 7*/
			var arr, args, reduced, len, i;

			i = 0;
			arr = Object(this);
			len = arr.length >>> 0;
			args = arguments;

			// If no initialValue, use first item of array (we know length !== 0 here)
			// and adjust i to start at second item
			if(args.length <= 1) {
				// Skip to the first real element in the array
				for(;;) {
					if(i in arr) {
						reduced = arr[i++];
						break;
					}

					// If we reached the end of the array without finding any real
					// elements, it's a TypeError
					if(++i >= len) {
						throw new TypeError();
					}
				}
			} else {
				// If initialValue provided, use it
				reduced = args[1];
			}

			// Do the actual reduce
			for(;i < len; ++i) {
				if(i in arr) {
					reduced = reduceFunc(reduced, arr[i], i, arr);
				}
			}

			return reduced;
		};

	function identity(x) {
		return x;
	}

	function crash(fatalError) {
		if(typeof monitorApi.reportUnhandled === 'function') {
			monitorApi.reportUnhandled();
		} else {
			enqueue(function() {
				throw fatalError;
			});
		}

		throw fatalError;
	}

	return when;
});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });
}).call(this,require("c:\\Users\\oberstet\\AppData\\Roaming\\npm\\node_modules\\browserify\\node_modules\\insert-module-globals\\node_modules\\process\\browser.js"))
},{"c:\\Users\\oberstet\\AppData\\Roaming\\npm\\node_modules\\browserify\\node_modules\\insert-module-globals\\node_modules\\process\\browser.js":1}],3:[function(require,module,exports){

/**
 * Module dependencies.
 */

var global = (function() { return this; })();

/**
 * WebSocket constructor.
 */

var WebSocket = global.WebSocket || global.MozWebSocket;

/**
 * Module exports.
 */

module.exports = WebSocket ? ws : null;

/**
 * WebSocket constructor.
 *
 * The third `opts` options object gets ignored in web browsers, since it's
 * non-standard, and throws a TypeError if passed to the constructor.
 * See: https://github.com/einaros/ws/issues/227
 *
 * @param {String} uri
 * @param {Array} protocols (optional)
 * @param {Object) opts (optional)
 * @api public
 */

function ws(uri, protocols, opts) {
  var instance;
  if (protocols) {
    instance = new WebSocket(uri, protocols);
  } else {
    instance = new WebSocket(uri);
  }
  return instance;
}

if (WebSocket) ws.prototype = WebSocket.prototype;

},{}],4:[function(require,module,exports){
/*
   npm install websocket
   npm install when
   npm install -g browserify

   http://dontkry.com/posts/code/browserify-and-the-universal-module-definition.html
   http://addyosmani.com/writing-modular-js/
 */

function websocket(root, url, protocols) {

   //if (typeof module !== 'undefined' && this.module !== module) {
   if (!'window' in root) {
      console.log("running on NodeJS");

      // our WebSocket shim with W3C API
      var websocket = {};

      // these will get defined by the specific shim
      websocket.protocol = undefined;
      websocket.send = undefined;
      websocket.close = undefined;

      // these will get called by the shim.
      // in case user code doesn't override these, provide these NOPs
      websocket.onmessage = function () {}
      websocket.onopen = function () {}
      websocket.onclose = function () {}

      // https://github.com/Worlize/WebSocket-Node
      //
      if (false) {

         (function() {

            //var WebSocketClient = require('websocket').client;
            var client = new WebSocketClient();

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
         })();

      // https://github.com/einaros
      //
      } else if (true) {

         (function () {

            var WebSocket = require('ws');
            var client = new WebSocket(url);

            websocket.send = function (msg) {
               client.send(msg, {binary: false});
            }

            websocket.close = function (code, reason) {
               client.close();
            }

            client.on('open', function () {
               websocket.onopen();
            });

            client.on('message', function (data, flags) {
               if (flags.binary) {

               } else {
                  websocket.onmessage({data: data});
               }
            });

            client.on('close', function () {
            });

            client.on('error', function () {
            });

         })();

      } else {

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


exports.websocket = websocket;

},{"ws":3}],5:[function(require,module,exports){
var when = require('when');
//var websocket = require('websocket');
var socketeer = require('./socketeer.js');

socket = null;
var isopen = false;

onload = function() {

   //socket = new WebSocket("ws://127.0.0.1:9000");
   socket = socketeer.websocket(this, 'ws://127.0.0.1:9000/');
   socket.binaryType = "arraybuffer";

   socket.onopen = function() {
      console.log("Connected!");
      isopen = true;
   }

   socket.onmessage = function(e) {
      if (typeof e.data == "string") {
         console.log("Text message received: " + e.data);
      } else {
         var arr = new Uint8Array(e.data);
         var hex = '';
         for (var i = 0; i < arr.length; i++) {
            hex += ('00' + arr[i].toString(16)).substr(-2);
         }
         console.log("Binary message received: " + hex);
      }
   }

   socket.onclose = function(e) {
      console.log("Connection closed.");
      socket = null;
      isopen = false;
   }
};

sendText = function () {
   if (isopen) {
      socket.send("Hello, world!");
      console.log("Text message sent.");               
   } else {
      console.log("Connection not opened.")
   }
};

sendBinary = function () {
   if (isopen) {
      var buf = new ArrayBuffer(32);
      var arr = new Uint8Array(buf);
      for (i = 0; i < arr.length; ++i) arr[i] = i;
      socket.send(buf);
      console.log("Binary message sent.");
   } else {
      console.log("Connection not opened.")
   }
};

},{"./socketeer.js":4,"when":2}]},{},[5])