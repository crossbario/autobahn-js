/*
 Copyright (c) 2010, Linden Research, Inc.
 Copyright (c) 2014, Joshua Bell

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 $/LicenseInfo$
 */

// Original can be found at:
//   https://bitbucket.org/lindenlab/llsd
// Modifications by Joshua Bell inexorabletash@gmail.com
//   https://github.com/inexorabletash/polyfill

// ES3/ES5 implementation of the Krhonos Typed Array Specification
//   Ref: http://www.khronos.org/registry/typedarray/specs/latest/
//   Date: 2011-02-01
//
// Variations:
//  * Allows typed_array.get/set() as alias for subscripts (typed_array[])
//  * Gradually migrating structure from Khronos spec to ES6 spec
if (typeof Uint8Array === "undefined") {
    (function (global, win) {
        'use strict';

        var undefined = (void 0); // Paranoia

        // Beyond this value, index getters/setters (i.e. array[0], array[1]) are so slow to
        // create, and consume so much memory, that the browser appears frozen.
        var MAX_ARRAY_LENGTH = 1e5;

        // Approximations of internal ECMAScript conversion functions
        function Type(v) {
            switch (typeof v) {
                case 'undefined':
                    return 'undefined';
                case 'boolean':
                    return 'boolean';
                case 'number':
                    return 'number';
                case 'string':
                    return 'string';
                default:
                    return v === null ? 'null' : 'object';
            }
        }

        // Class returns internal [[Class]] property, used to avoid cross-frame instanceof issues:
        function Class(v) {
            return Object.prototype.toString.call(v).replace(/^\[object *|\]$/g, '');
        }

        function IsCallable(o) {
            return typeof o === 'function';
        }

        function ToObject(v) {
            if (v === null || v === undefined) throw TypeError();
            return Object(v);
        }

        function ToInt32(v) {
            return v >> 0;
        }

        function ToUint32(v) {
            return v >>> 0;
        }

        // Snapshot intrinsics
        var LN2 = Math.LN2,
            abs = Math.abs,
            floor = Math.floor,
            log = Math.log,
            max = Math.max,
            min = Math.min,
            pow = Math.pow,
            round = Math.round;

        // emulate ES5 getter/setter API using legacy APIs
        // http://blogs.msdn.com/b/ie/archive/2010/09/07/transitioning-existing-code-to-the-es5-getter-setter-apis.aspx
        // (second clause tests for Object.defineProperty() in IE<9 that only supports extending DOM prototypes, but
        // note that IE<9 does not support __defineGetter__ or __defineSetter__ so it just renders the method harmless)

        (function () {
            var orig = Object.defineProperty;
            var dom_only = !(function () {
                try {
                    return Object.defineProperty({}, 'x', {});
                } catch (_) {
                    return false;
                }
            }());

            if (!orig || dom_only) {
                Object.defineProperty = function (o, prop, desc) {
                    // In IE8 try built-in implementation for defining properties on DOM prototypes.
                    if (orig) {
                        try {
                            return orig(o, prop, desc);
                        } catch (_) {
                        }
                    }

                    if (o !== Object(o))
                        throw TypeError('Object.defineProperty called on non-object');
                    if (Object.prototype.__defineGetter__ && ('get' in desc))
                        Object.prototype.__defineGetter__.call(o, prop, desc.get);
                    if (Object.prototype.__defineSetter__ && ('set' in desc))
                        Object.prototype.__defineSetter__.call(o, prop, desc.set);
                    if ('value' in desc)
                        o[prop] = desc.value;
                    return o;
                };
            }
        }());

        // ES5: Make obj[index] an alias for obj._getter(index)/obj._setter(index, value)
        // for index in 0 ... obj.length
        function makeArrayAccessors(obj) {
            if (obj.length > MAX_ARRAY_LENGTH) throw RangeError('Array too large for polyfill');

            function makeArrayAccessor(index) {
                Object.defineProperty(obj, index, {
                    'get': function () {
                        return obj._getter(index);
                    },
                    'set': function (v) {
                        obj._setter(index, v);
                    },
                    enumerable: true,
                    configurable: false
                });
            }

            var i;
            for (i = 0; i < obj.length; i += 1) {
                makeArrayAccessor(i);
            }
        }

        // Internal conversion functions:
        //    pack<Type>()   - take a number (interpreted as Type), output a byte array
        //    unpack<Type>() - take a byte array, output a Type-like number

        function as_signed(value, bits) {
            var s = 32 - bits;
            return (value << s) >> s;
        }

        function as_unsigned(value, bits) {
            var s = 32 - bits;
            return (value << s) >>> s;
        }

        function packI8(n) {
            return [n & 0xff];
        }

        function unpackI8(bytes) {
            return as_signed(bytes[0], 8);
        }

        function packU8(n) {
            return [n & 0xff];
        }

        function unpackU8(bytes) {
            return as_unsigned(bytes[0], 8);
        }

        function packU8Clamped(n) {
            n = round(Number(n));
            return [n < 0 ? 0 : n > 0xff ? 0xff : n & 0xff];
        }

        function packI16(n) {
            return [(n >> 8) & 0xff, n & 0xff];
        }

        function unpackI16(bytes) {
            return as_signed(bytes[0] << 8 | bytes[1], 16);
        }

        function packU16(n) {
            return [(n >> 8) & 0xff, n & 0xff];
        }

        function unpackU16(bytes) {
            return as_unsigned(bytes[0] << 8 | bytes[1], 16);
        }

        function packI32(n) {
            return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
        }

        function unpackI32(bytes) {
            return as_signed(bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], 32);
        }

        function packU32(n) {
            return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
        }

        function unpackU32(bytes) {
            return as_unsigned(bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], 32);
        }

        function packIEEE754(v, ebits, fbits) {

            var bias = (1 << (ebits - 1)) - 1,
                s, e, f, ln,
                i, bits, str, bytes;

            function roundToEven(n) {
                var w = floor(n), f = n - w;
                if (f < 0.5)
                    return w;
                if (f > 0.5)
                    return w + 1;
                return w % 2 ? w + 1 : w;
            }

            // Compute sign, exponent, fraction
            if (v !== v) {
                // NaN
                // http://dev.w3.org/2006/webapi/WebIDL/#es-type-mapping
                e = (1 << ebits) - 1;
                f = pow(2, fbits - 1);
                s = 0;
            } else if (v === Infinity || v === -Infinity) {
                e = (1 << ebits) - 1;
                f = 0;
                s = (v < 0) ? 1 : 0;
            } else if (v === 0) {
                e = 0;
                f = 0;
                s = (1 / v === -Infinity) ? 1 : 0;
            } else {
                s = v < 0;
                v = abs(v);

                if (v >= pow(2, 1 - bias)) {
                    e = min(floor(log(v) / LN2), 1023);
                    f = roundToEven(v / pow(2, e) * pow(2, fbits));
                    if (f / pow(2, fbits) >= 2) {
                        e = e + 1;
                        f = 1;
                    }
                    if (e > bias) {
                        // Overflow
                        e = (1 << ebits) - 1;
                        f = 0;
                    } else {
                        // Normalized
                        e = e + bias;
                        f = f - pow(2, fbits);
                    }
                } else {
                    // Denormalized
                    e = 0;
                    f = roundToEven(v / pow(2, 1 - bias - fbits));
                }
            }

            // Pack sign, exponent, fraction
            bits = [];
            for (i = fbits; i; i -= 1) {
                bits.push(f % 2 ? 1 : 0);
                f = floor(f / 2);
            }
            for (i = ebits; i; i -= 1) {
                bits.push(e % 2 ? 1 : 0);
                e = floor(e / 2);
            }
            bits.push(s ? 1 : 0);
            bits.reverse();
            str = bits.join('');

            // Bits to bytes
            bytes = [];
            while (str.length) {
                bytes.push(parseInt(str.substring(0, 8), 2));
                str = str.substring(8);
            }
            return bytes;
        }

        function unpackIEEE754(bytes, ebits, fbits) {
            // Bytes to bits
            var bits = [], i, j, b, str,
                bias, s, e, f;

            for (i = bytes.length; i; i -= 1) {
                b = bytes[i - 1];
                for (j = 8; j; j -= 1) {
                    bits.push(b % 2 ? 1 : 0);
                    b = b >> 1;
                }
            }
            bits.reverse();
            str = bits.join('');

            // Unpack sign, exponent, fraction
            bias = (1 << (ebits - 1)) - 1;
            s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
            e = parseInt(str.substring(1, 1 + ebits), 2);
            f = parseInt(str.substring(1 + ebits), 2);

            // Produce number
            if (e === (1 << ebits) - 1) {
                return f !== 0 ? NaN : s * Infinity;
            } else if (e > 0) {
                // Normalized
                return s * pow(2, e - bias) * (1 + f / pow(2, fbits));
            } else if (f !== 0) {
                // Denormalized
                return s * pow(2, -(bias - 1)) * (f / pow(2, fbits));
            } else {
                return s < 0 ? -0 : 0;
            }
        }

        function unpackF64(b) {
            return unpackIEEE754(b, 11, 52);
        }

        function packF64(v) {
            return packIEEE754(v, 11, 52);
        }

        function unpackF32(b) {
            return unpackIEEE754(b, 8, 23);
        }

        function packF32(v) {
            return packIEEE754(v, 8, 23);
        }

        //
        // 3 The ArrayBuffer Type
        //

        (function () {

            function ArrayBuffer(length) {
                length = ToInt32(length);
                if (length < 0) throw RangeError('ArrayBuffer size is not a small enough positive integer.');
                Object.defineProperty(this, 'byteLength', {value: length});
                Object.defineProperty(this, '_bytes', {value: Array(length)});

                for (var i = 0; i < length; i += 1)
                    this._bytes[i] = 0;
            }

            global.ArrayBuffer = global.ArrayBuffer || ArrayBuffer;

            //
            // 5 The Typed Array View Types
            //

            function $TypedArray$() {

                // %TypedArray% ( length )
                if (!arguments.length || typeof arguments[0] !== 'object') {
                    return (function (length) {
                        length = ToInt32(length);
                        if (length < 0) throw RangeError('length is not a small enough positive integer.');
                        Object.defineProperty(this, 'length', {value: length});
                        Object.defineProperty(this, 'byteLength', {value: length * this.BYTES_PER_ELEMENT});
                        Object.defineProperty(this, 'buffer', {value: new ArrayBuffer(this.byteLength)});
                        Object.defineProperty(this, 'byteOffset', {value: 0});

                    }).apply(this, arguments);
                }

                // %TypedArray% ( typedArray )
                if (arguments.length >= 1 &&
                    Type(arguments[0]) === 'object' &&
                    arguments[0] instanceof $TypedArray$) {
                    return (function (typedArray) {
                        if (this.constructor !== typedArray.constructor) throw TypeError();

                        var byteLength = typedArray.length * this.BYTES_PER_ELEMENT;
                        Object.defineProperty(this, 'buffer', {value: new ArrayBuffer(byteLength)});
                        Object.defineProperty(this, 'byteLength', {value: byteLength});
                        Object.defineProperty(this, 'byteOffset', {value: 0});
                        Object.defineProperty(this, 'length', {value: typedArray.length});

                        for (var i = 0; i < this.length; i += 1)
                            this._setter(i, typedArray._getter(i));

                    }).apply(this, arguments);
                }

                // %TypedArray% ( array )
                if (arguments.length >= 1 &&
                    Type(arguments[0]) === 'object' && !(arguments[0] instanceof $TypedArray$) && !(arguments[0] instanceof ArrayBuffer || Class(arguments[0]) === 'ArrayBuffer')) {
                    return (function (array) {

                        var byteLength = array.length * this.BYTES_PER_ELEMENT;
                        Object.defineProperty(this, 'buffer', {value: new ArrayBuffer(byteLength)});
                        Object.defineProperty(this, 'byteLength', {value: byteLength});
                        Object.defineProperty(this, 'byteOffset', {value: 0});
                        Object.defineProperty(this, 'length', {value: array.length});

                        for (var i = 0; i < this.length; i += 1) {
                            var s = array[i];
                            this._setter(i, Number(s));
                        }
                    }).apply(this, arguments);
                }

                // %TypedArray% ( buffer, byteOffset=0, length=undefined )
                if (arguments.length >= 1 &&
                    Type(arguments[0]) === 'object' &&
                    (arguments[0] instanceof ArrayBuffer || Class(arguments[0]) === 'ArrayBuffer')) {
                    return (function (buffer, byteOffset, length) {

                        byteOffset = ToUint32(byteOffset);
                        if (byteOffset > buffer.byteLength)
                            throw RangeError('byteOffset out of range');

                        // The given byteOffset must be a multiple of the element
                        // size of the specific type, otherwise an exception is raised.
                        if (byteOffset % this.BYTES_PER_ELEMENT)
                            throw RangeError('buffer length minus the byteOffset is not a multiple of the element size.');

                        if (length === undefined) {
                            var byteLength = buffer.byteLength - byteOffset;
                            if (byteLength % this.BYTES_PER_ELEMENT)
                                throw RangeError('length of buffer minus byteOffset not a multiple of the element size');
                            length = byteLength / this.BYTES_PER_ELEMENT;

                        } else {
                            length = ToUint32(length);
                            byteLength = length * this.BYTES_PER_ELEMENT;
                        }

                        if ((byteOffset + byteLength) > buffer.byteLength)
                            throw RangeError('byteOffset and length reference an area beyond the end of the buffer');

                        Object.defineProperty(this, 'buffer', {value: buffer});
                        Object.defineProperty(this, 'byteLength', {value: byteLength});
                        Object.defineProperty(this, 'byteOffset', {value: byteOffset});
                        Object.defineProperty(this, 'length', {value: length});

                    }).apply(this, arguments);
                }

                // %TypedArray% ( all other argument combinations )
                throw TypeError();
            }

            // Properties of the %TypedArray Instrinsic Object

            // %TypedArray%.from ( source , mapfn=undefined, thisArg=undefined )
            Object.defineProperty($TypedArray$, 'from', {value: function (iterable) {
                return new this(iterable);
            }});

            // %TypedArray%.of ( ...items )
            Object.defineProperty($TypedArray$, 'of', {value: function (/*...items*/) {
                return new this(arguments);
            }});

            // %TypedArray%.prototype
            var $TypedArrayPrototype$ = {};
            $TypedArray$.prototype = $TypedArrayPrototype$;

            // WebIDL: getter type (unsigned long index);
            Object.defineProperty($TypedArray$.prototype, '_getter', {value: function (index) {
                if (arguments.length < 1) throw SyntaxError('Not enough arguments');

                index = ToUint32(index);
                if (index >= this.length)
                    return undefined;

                var bytes = [], i, o;
                for (i = 0, o = this.byteOffset + index * this.BYTES_PER_ELEMENT;
                     i < this.BYTES_PER_ELEMENT;
                     i += 1, o += 1) {
                    bytes.push(this.buffer._bytes[o]);
                }
                return this._unpack(bytes);
            }});

            // NONSTANDARD: convenience alias for getter: type get(unsigned long index);
            Object.defineProperty($TypedArray$.prototype, 'get', {value: $TypedArray$.prototype._getter});

            // WebIDL: setter void (unsigned long index, type value);
            Object.defineProperty($TypedArray$.prototype, '_setter', {value: function (index, value) {
                if (arguments.length < 2) throw SyntaxError('Not enough arguments');

                index = ToUint32(index);
                if (index >= this.length)
                    return;

                var bytes = this._pack(value), i, o;
                for (i = 0, o = this.byteOffset + index * this.BYTES_PER_ELEMENT;
                     i < this.BYTES_PER_ELEMENT;
                     i += 1, o += 1) {
                    this.buffer._bytes[o] = bytes[i];
                }
            }});

            // get %TypedArray%.prototype.buffer
            // get %TypedArray%.prototype.byteLength
            // get %TypedArray%.prototype.byteOffset
            // -- applied directly to the object in the constructor

            // %TypedArray%.prototype.constructor
            Object.defineProperty($TypedArray$.prototype, 'constructor', {value: $TypedArray$});

            // %TypedArray%.prototype.copyWithin (target, start, end = this.length )
            Object.defineProperty($TypedArray$.prototype, 'copyWithin', {value: function (m_target, m_start) {
                var m_end = arguments[2];

                var m_o = ToObject(this);
                var lenVal = m_o.length;
                var m_len = ToUint32(lenVal);
                m_len = max(m_len, 0);
                var relativeTarget = ToInt32(m_target);
                var m_to;
                if (relativeTarget < 0)
                {
                    m_to = max(m_len + relativeTarget, 0);
                }
                else
                {
                    m_to = min(relativeTarget, m_len);
                }
                var relativeStart = ToInt32(m_start);
                var m_from;
                if (relativeStart < 0)
                {
                    m_from = max(m_len + relativeStart, 0);
                }
                else
                {
                    m_from = min(relativeStart, m_len);
                }
                var relativeEnd;
                if (m_end === undefined)
                {
                    relativeEnd = m_len;
                }
                else
                {
                    relativeEnd = ToInt32(m_end);
                }
                var m_final;
                if (relativeEnd < 0) {
                     m_final = max(m_len + relativeEnd, 0);
                } else {
                     m_final = min(relativeEnd, m_len);
                }

                var m_count = min(m_final - m_from, m_len - m_to);
                var direction;
                if (from < m_to && m_to < m_from + m_count) {
                    direction = -1;
                    m_from = m_from + m_count - 1;
                    m_to = m_to + m_count - 1;
                } else {
                    direction = 1;
                }
                while (count > 0) {
                    m_o._setter(m_to, m_o._getter(m_from));
                    m_from = m_from + direction;
                    m_to = m_to + direction;
                    m_count = m_count - 1;
                }
                return m_o;
            }});

            // %TypedArray%.prototype.entries ( )
            // -- defined in es6.js to shim browsers w/ native TypedArrays

            // %TypedArray%.prototype.every ( callbackfn, thisArg = undefined )
            Object.defineProperty($TypedArray$.prototype, 'every', {value: function (callbackfn) {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                if (!IsCallable(callbackfn)) throw TypeError();
                var thisArg = arguments[1];
                for (var i = 0; i < len; i++) {
                    if (!callbackfn.call(thisArg, t._getter(i), i, t))
                        return false;
                }
                return true;
            }});

            // %TypedArray%.prototype.fill (value, start = 0, end = this.length )
            Object.defineProperty($TypedArray$.prototype, 'fill', {value: function (value) {
                var m_start = arguments[1],
                    m_end = arguments[2];

                var m_o = ToObject(this);
                var lenVal = m_o.length;
                var m_len = ToUint32(lenVal);
                m_len = max(m_len, 0);
                var relativeStart = ToInt32(m_start);
                var m_k;
                if (relativeStart < 0)
                {
                    m_k = max((m_len + relativeStart), 0);
                }
                else
                {
                    m_k = min(relativeStart, m_len);
                }
                var relativeEnd;
                if (m_end === undefined)
                {
                    relativeEnd = m_len;
                }
                else
                {
                    relativeEnd = ToInt32(m_end);
                }
                var m_final;
                if (relativeEnd < 0)
                {
                    m_final = max((m_len + relativeEnd), 0);
                }
                else
                {
                    m_final = min(relativeEnd, m_len);
                }
                while (m_k < m_final) {
                    m_o._setter(m_k, value);
                    m_k += 1;
                }
                return m_o;
            }});

            // %TypedArray%.prototype.filter ( callbackfn, thisArg = undefined )
            Object.defineProperty($TypedArray$.prototype, 'filter', {value: function (callbackfn) {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                if (!IsCallable(callbackfn)) throw TypeError();
                var res = [];
                var thisp = arguments[1];
                for (var i = 0; i < len; i++) {
                    var val = t._getter(i); // in case fun mutates this
                    if (callbackfn.call(thisp, val, i, t))
                        res.push(val);
                }
                return new this.constructor(res);
            }});

            // %TypedArray%.prototype.find (predicate, thisArg = undefined)
            Object.defineProperty($TypedArray$.prototype, 'find', {value: function (predicate) {
                var o = ToObject(this);
                var lenValue = o.length;
                var len = ToUint32(lenValue);
                if (!IsCallable(predicate)) throw TypeError();
                var t = arguments.length > 1 ? arguments[1] : undefined;
                var k = 0;
                while (k < len) {
                    var kValue = o._getter(k);
                    var testResult = predicate.call(t, kValue, k, o);
                    if (Boolean(testResult))
                        return kValue;
                    ++k;
                }
                return undefined;
            }});

            // %TypedArray%.prototype.findIndex ( predicate, thisArg = undefined )
            Object.defineProperty($TypedArray$.prototype, 'findIndex', {value: function (predicate) {
                var o = ToObject(this);
                var lenValue = o.length;
                var len = ToUint32(lenValue);
                if (!IsCallable(predicate)) throw TypeError();
                var t = arguments.length > 1 ? arguments[1] : undefined;
                var k = 0;
                while (k < len) {
                    var kValue = o._getter(k);
                    var testResult = predicate.call(t, kValue, k, o);
                    if (Boolean(testResult))
                        return k;
                    ++k;
                }
                return -1;
            }});

            // %TypedArray%.prototype.forEach ( callbackfn, thisArg = undefined )
            Object.defineProperty($TypedArray$.prototype, 'forEach', {value: function (callbackfn) {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                if (!IsCallable(callbackfn)) throw TypeError();
                var thisp = arguments[1];
                for (var i = 0; i < len; i++)
                    callbackfn.call(thisp, t._getter(i), i, t);
            }});

            // %TypedArray%.prototype.indexOf (searchElement, fromIndex = 0 )
            Object.defineProperty($TypedArray$.prototype, 'indexOf', {value: function (searchElement) {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                if (len === 0) return -1;
                var no = 0;
                var na;
                if (arguments.length > 0) {
                    na = Number(arguments[1]);
                    if (na !== no) {
                        no = 0;
                    } else if (na !== 0 && na !== (1 / 0) && na !== -(1 / 0)) {
                        no = (na > 0 || -1) * floor(abs(na));
                    }
                }
                if (no >= len) return -1;
                var k = no >= 0 ? no : max(len - abs(no), 0);
                for (; k < len; k++) {
                    if (t._getter(k) === searchElement) {
                        return k;
                    }
                }
                return -1;
            }});

            // %TypedArray%.prototype.join ( separator )
            Object.defineProperty($TypedArray$.prototype, 'join', {value: function (separator) {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                var tmp = Array(len);
                for (var i = 0; i < len; ++i)
                    tmp[i] = t._getter(i);
                return tmp.join(separator === undefined ? ',' : separator); // Hack for IE7
            }});

            // %TypedArray%.prototype.keys ( )
            // -- defined in es6.js to shim browsers w/ native TypedArrays

            // %TypedArray%.prototype.lastIndexOf ( searchElement, fromIndex = this.length-1 )
            Object.defineProperty($TypedArray$.prototype, 'lastIndexOf', {value: function (searchElement) {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                if (len === 0) return -1;
                var n = len;
                if (arguments.length > 1) {
                    n = Number(arguments[1]);
                    if (n !== n) {
                        n = 0;
                    } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
                        n = (n > 0 || -1) * floor(abs(n));
                    }
                }
                var k = n >= 0 ? min(n, len - 1) : len - abs(n);
                for (; k >= 0; k--) {
                    if (t._getter(k) === searchElement)
                        return k;
                }
                return -1;
            }});

            // get %TypedArray%.prototype.length
            // -- applied directly to the object in the constructor

            // %TypedArray%.prototype.map ( callbackfn, thisArg = undefined )
            Object.defineProperty($TypedArray$.prototype, 'map', {value: function (callbackfn) {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                if (!IsCallable(callbackfn)) throw TypeError();
                var res = [];
                res.length = len;
                var thisp = arguments[1];
                for (var i = 0; i < len; i++)
                    res[i] = callbackfn.call(thisp, t._getter(i), i, t);
                return new this.constructor(res);
            }});

            // %TypedArray%.prototype.reduce ( callbackfn [, initialValue] )
            Object.defineProperty($TypedArray$.prototype, 'reduce', {value: function (callbackfn) {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                if (!IsCallable(callbackfn)) throw TypeError();
                // no value to return if no initial value and an empty array
                if (len === 0 && arguments.length === 1) throw TypeError();
                var k = 0;
                var accumulator;
                if (arguments.length >= 2) {
                    accumulator = arguments[1];
                } else {
                    accumulator = t._getter(k++);
                }
                while (k < len) {
                    accumulator = callbackfn.call(undefined, accumulator, t._getter(k), k, t);
                    k++;
                }
                return accumulator;
            }});

            // %TypedArray%.prototype.reduceRight ( callbackfn [, initialValue] )
            Object.defineProperty($TypedArray$.prototype, 'reduceRight', {value: function (callbackfn) {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                if (!IsCallable(callbackfn)) throw TypeError();
                // no value to return if no initial value, empty array
                if (len === 0 && arguments.length === 1) throw TypeError();
                var k = len - 1;
                var accumulator;
                if (arguments.length >= 2) {
                    accumulator = arguments[1];
                } else {
                    accumulator = t._getter(k--);
                }
                while (k >= 0) {
                    accumulator = callbackfn.call(undefined, accumulator, t._getter(k), k, t);
                    k--;
                }
                return accumulator;
            }});

            // %TypedArray%.prototype.reverse ( )
            Object.defineProperty($TypedArray$.prototype, 'reverse', {value: function () {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                var half = floor(len / 2);
                for (var i = 0, j = len - 1; i < half; ++i, --j) {
                    var tmp = t._getter(i);
                    t._setter(i, t._getter(j));
                    t._setter(j, tmp);
                }
                return t;
            }});

            // %TypedArray%.prototype.set(array, offset = 0 )
            // %TypedArray%.prototype.set(typedArray, offset = 0 )
            // WebIDL: void set(TypedArray array, optional unsigned long offset);
            // WebIDL: void set(sequence<type> array, optional unsigned long offset);
            Object.defineProperty($TypedArray$.prototype, 'set', {value: function (index, value) {
                if (arguments.length < 1) throw SyntaxError('Not enough arguments');
                var array, sequence, offset, len,
                    i, s, d,
                    byteOffset, byteLength, tmp;

                if (typeof arguments[0] === 'object' && arguments[0].constructor === this.constructor) {
                    // void set(TypedArray array, optional unsigned long offset);
                    array = arguments[0];
                    offset = ToUint32(arguments[1]);

                    if (offset + array.length > this.length) {
                        throw RangeError('Offset plus length of array is out of range');
                    }

                    byteOffset = this.byteOffset + offset * this.BYTES_PER_ELEMENT;
                    byteLength = array.length * this.BYTES_PER_ELEMENT;

                    if (array.buffer === this.buffer) {
                        tmp = [];
                        for (i = 0, s = array.byteOffset; i < byteLength; i += 1, s += 1) {
                            tmp[i] = array.buffer._bytes[s];
                        }
                        for (i = 0, d = byteOffset; i < byteLength; i += 1, d += 1) {
                            this.buffer._bytes[d] = tmp[i];
                        }
                    } else {
                        for (i = 0, s = array.byteOffset, d = byteOffset;
                             i < byteLength; i += 1, s += 1, d += 1) {
                            this.buffer._bytes[d] = array.buffer._bytes[s];
                        }
                    }
                } else if (typeof arguments[0] === 'object' && typeof arguments[0].length !== 'undefined') {
                    // void set(sequence<type> array, optional unsigned long offset);
                    sequence = arguments[0];
                    len = ToUint32(sequence.length);
                    offset = ToUint32(arguments[1]);

                    if (offset + len > this.length) {
                        throw RangeError('Offset plus length of array is out of range');
                    }

                    for (i = 0; i < len; i += 1) {
                        s = sequence[i];
                        this._setter(offset + i, Number(s));
                    }
                } else {
                    throw TypeError('Unexpected argument type(s)');
                }
            }});

            // %TypedArray%.prototype.slice ( start, end )
            Object.defineProperty($TypedArray$.prototype, 'slice', {value: function (m_start, m_end) {
                var m_o = ToObject(this);
                var lenVal = m_o.length;
                var m_len = ToUint32(lenVal);
                var relativeStart = ToInt32(m_start);
                var m_k = (relativeStart < 0) ? max(m_len + relativeStart, 0) : min(relativeStart, m_len);
                var relativeEnd = (m_end === undefined) ? m_len : ToInt32(m_end);
                var m_final = (relativeEnd < 0) ? max(m_len + relativeEnd, 0) : min(relativeEnd, m_len);
                var m_count = m_final - m_k;
                var m_c = m_o.constructor;
                var m_a = new m_c(m_count);
                var m_n = 0;
                while (m_k < m_final) {
                    var kValue = m_o._getter(m_k);
                    m_a._setter(m_n, kValue);
                    ++m_k;
                    ++m_n;
                }
                return m_a;
            }});

            // %TypedArray%.prototype.some ( callbackfn, thisArg = undefined )
            Object.defineProperty($TypedArray$.prototype, 'some', {value: function (callbackfn) {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                if (!IsCallable(callbackfn)) throw TypeError();
                var thisp = arguments[1];
                for (var i = 0; i < len; i++) {
                    if (callbackfn.call(thisp, t._getter(i), i, t)) {
                        return true;
                    }
                }
                return false;
            }});

            // %TypedArray%.prototype.sort ( comparefn )
            Object.defineProperty($TypedArray$.prototype, 'sort', {value: function (comparefn) {
                if (this === undefined || this === null) throw TypeError();
                var t = Object(this);
                var len = ToUint32(t.length);
                var tmp = Array(len);
                for (var i = 0; i < len; ++i)
                    tmp[i] = t._getter(i);
                if (comparefn) tmp.sort(comparefn); else tmp.sort(); // Hack for IE8/9
                for (i = 0; i < len; ++i)
                    t._setter(i, tmp[i]);
                return t;
            }});

            // %TypedArray%.prototype.subarray(begin = 0, end = this.length )
            // WebIDL: TypedArray subarray(long begin, optional long end);
            Object.defineProperty($TypedArray$.prototype, 'subarray', {value: function (start, end) {
                function clamp(v, min, max) {
                    return v < min ? min : v > max ? max : v;
                }

                start = ToInt32(start);
                end = ToInt32(end);

                if (arguments.length < 1) {
                    start = 0;
                }
                if (arguments.length < 2) {
                    end = this.length;
                }

                if (start < 0) {
                    start = this.length + start;
                }
                if (end < 0) {
                    end = this.length + end;
                }

                start = clamp(start, 0, this.length);
                end = clamp(end, 0, this.length);

                var len = end - start;
                if (len < 0) {
                    len = 0;
                }

                return new this.constructor(
                    this.buffer, this.byteOffset + start * this.BYTES_PER_ELEMENT, len);
            }});

            // %TypedArray%.prototype.toLocaleString ( )
            // %TypedArray%.prototype.toString ( )
            // %TypedArray%.prototype.values ( )
            // %TypedArray%.prototype [ @@iterator ] ( )
            // get %TypedArray%.prototype [ @@toStringTag ]
            // -- defined in es6.js to shim browsers w/ native TypedArrays

            function makeTypedArray(elementSize, pack, unpack) {
                // Each TypedArray type requires a distinct constructor instance with
                // identical logic, which this produces.
                var TypedArray = function () {
                    Object.defineProperty(this, 'constructor', {value: TypedArray});
                    $TypedArray$.apply(this, arguments);
                    makeArrayAccessors(this);
                };
                if ('__proto__' in TypedArray) {
                    TypedArray.__proto__ = $TypedArray$;
                } else {
                    TypedArray.from = $TypedArray$.from;
                    TypedArray.of = $TypedArray$.of;
                }

                TypedArray.BYTES_PER_ELEMENT = elementSize;

                var TypedArrayPrototype = function () {
                };
                TypedArrayPrototype.prototype = $TypedArrayPrototype$;

                TypedArray.prototype = new TypedArrayPrototype();

                Object.defineProperty(TypedArray.prototype, 'BYTES_PER_ELEMENT', {value: elementSize});
                Object.defineProperty(TypedArray.prototype, '_pack', {value: pack});
                Object.defineProperty(TypedArray.prototype, '_unpack', {value: unpack});

                return TypedArray;
            }

            var Int8Array = makeTypedArray(1, packI8, unpackI8);
            var Uint8Array = makeTypedArray(1, packU8, unpackU8);
            var Uint8ClampedArray = makeTypedArray(1, packU8Clamped, unpackU8);
            var Int16Array = makeTypedArray(2, packI16, unpackI16);
            var Uint16Array = makeTypedArray(2, packU16, unpackU16);
            var Int32Array = makeTypedArray(4, packI32, unpackI32);
            var Uint32Array = makeTypedArray(4, packU32, unpackU32);
            var Float32Array = makeTypedArray(4, packF32, unpackF32);
            var Float64Array = makeTypedArray(8, packF64, unpackF64);

            global.Int8Array = win.Int8Array = global.Int8Array || Int8Array;
            global.Uint8Array = win.Uint8Array = global.Uint8Array || Uint8Array;
            global.Uint8ClampedArray = win.Uint8ClampedArray = global.Uint8ClampedArray || Uint8ClampedArray;
            global.Int16Array = win.Int16Array = global.Int16Array || Int16Array;
            global.Uint16Array = win.Uint16Array = global.Uint16Array || Uint16Array;
            global.Int32Array = win.Int32Array = global.Int32Array || Int32Array;
            global.Uint32Array = win.Uint32Array = global.Uint32Array || Uint32Array;
            global.Float32Array = win.Float32Array = global.Float32Array || Float32Array;
            global.Float64Array = win.Float64Array = global.Float64Array || Float64Array;
        }());

        //
        // 6 The DataView View Type
        //

        (function () {
            function r(array, index) {
                return IsCallable(array.get) ? array.get(index) : array[index];
            }

            var IS_BIG_ENDIAN = (function () {
                var u16array = new global.Uint16Array([0x1234]),
                    u8array = new global.Uint8Array(u16array.buffer);
                return r(u8array, 0) === 0x12;
            }());

            // DataView(buffer, byteOffset=0, byteLength=undefined)
            // WebIDL: Constructor(ArrayBuffer buffer,
            //                     optional unsigned long byteOffset,
            //                     optional unsigned long byteLength)
            function DataView(buffer, byteOffset, byteLength) {
                if (!(buffer instanceof ArrayBuffer || Class(buffer) === 'ArrayBuffer')) throw TypeError();

                byteOffset = ToUint32(byteOffset);
                if (byteOffset > buffer.byteLength)
                    throw RangeError('byteOffset out of range');

                if (byteLength === undefined)
                    byteLength = buffer.byteLength - byteOffset;
                else
                    byteLength = ToUint32(byteLength);

                if ((byteOffset + byteLength) > buffer.byteLength)
                    throw RangeError('byteOffset and length reference an area beyond the end of the buffer');

                Object.defineProperty(this, 'buffer', {value: buffer});
                Object.defineProperty(this, 'byteLength', {value: byteLength});
                Object.defineProperty(this, 'byteOffset', {value: byteOffset});
            };

            // get DataView.prototype.buffer
            // get DataView.prototype.byteLength
            // get DataView.prototype.byteOffset
            // -- applied directly to instances by the constructor

            function makeGetter(arrayType) {
                return function GetViewValue(byteOffset, littleEndian) {
                    byteOffset = ToUint32(byteOffset);

                    if (byteOffset + arrayType.BYTES_PER_ELEMENT > this.byteLength)
                        throw RangeError('Array index out of range');

                    byteOffset += this.byteOffset;

                    var uint8Array = new global.Uint8Array(this.buffer, byteOffset, arrayType.BYTES_PER_ELEMENT),
                        bytes = [];
                    for (var i = 0; i < arrayType.BYTES_PER_ELEMENT; i += 1)
                        bytes.push(r(uint8Array, i));

                    if (Boolean(littleEndian) === Boolean(IS_BIG_ENDIAN))
                        bytes.reverse();

                    return r(new arrayType(new global.Uint8Array(bytes).buffer), 0);
                };
            }

            Object.defineProperty(DataView.prototype, 'getUint8', {value: makeGetter(global.Uint8Array)});
            Object.defineProperty(DataView.prototype, 'getInt8', {value: makeGetter(global.Int8Array)});
            Object.defineProperty(DataView.prototype, 'getUint16', {value: makeGetter(global.Uint16Array)});
            Object.defineProperty(DataView.prototype, 'getInt16', {value: makeGetter(global.Int16Array)});
            Object.defineProperty(DataView.prototype, 'getUint32', {value: makeGetter(global.Uint32Array)});
            Object.defineProperty(DataView.prototype, 'getInt32', {value: makeGetter(global.Int32Array)});
            Object.defineProperty(DataView.prototype, 'getFloat32', {value: makeGetter(global.Float32Array)});
            Object.defineProperty(DataView.prototype, 'getFloat64', {value: makeGetter(global.Float64Array)});

            function makeSetter(arrayType) {
                return function SetViewValue(byteOffset, value, littleEndian) {
                    byteOffset = ToUint32(byteOffset);
                    if (byteOffset + arrayType.BYTES_PER_ELEMENT > this.byteLength)
                        throw RangeError('Array index out of range');

                    // Get bytes
                    var typeArray = new arrayType([value]),
                        byteArray = new global.Uint8Array(typeArray.buffer),
                        bytes = [], i, byteView;

                    for (i = 0; i < arrayType.BYTES_PER_ELEMENT; i += 1)
                        bytes.push(r(byteArray, i));

                    // Flip if necessary
                    if (Boolean(littleEndian) === Boolean(IS_BIG_ENDIAN))
                        bytes.reverse();

                    // Write them
                    byteView = new Uint8Array(this.buffer, byteOffset, arrayType.BYTES_PER_ELEMENT);
                    byteView.set(bytes);
                };
            }

            Object.defineProperty(DataView.prototype, 'setUint8', {value: makeSetter(global.Uint8Array)});
            Object.defineProperty(DataView.prototype, 'setInt8', {value: makeSetter(global.Int8Array)});
            Object.defineProperty(DataView.prototype, 'setUint16', {value: makeSetter(global.Uint16Array)});
            Object.defineProperty(DataView.prototype, 'setInt16', {value: makeSetter(global.Int16Array)});
            Object.defineProperty(DataView.prototype, 'setUint32', {value: makeSetter(global.Uint32Array)});
            Object.defineProperty(DataView.prototype, 'setInt32', {value: makeSetter(global.Int32Array)});
            Object.defineProperty(DataView.prototype, 'setFloat32', {value: makeSetter(global.Float32Array)});
            Object.defineProperty(DataView.prototype, 'setFloat64', {value: makeSetter(global.Float64Array)});

            global.DataView = global.DataView || DataView;

        }());

    }(exports, window)
        );
}
// workaround for crypto-js on IE11
// http://code.google.com/p/crypto-js/issues/detail?id=81
if (typeof window !== "undefined") {
    if (!('Uint8ClampedArray' in window)) {
        window.Uint8ClampedArray = window.Uint8Array;
    }
}