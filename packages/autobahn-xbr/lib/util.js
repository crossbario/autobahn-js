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

const assert = require('assert');
const web3 = require('web3');
const BN = web3.utils.BN;

// https://www.npmjs.com/package/uuid
const _uuid = require('uuid');

// https://www.npmjs.com/package/uuid-parse
const uuid_parse = require('uuid-parse');


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


function unpackUint256 (value) {
    // FIXME: wont work in browser ?
    let buffer = Buffer.from(value);
    return buffer.readUIntBE(0, value.length);
}


function uuid (value) {

    if (value !== undefined) {
        // parse UUID string

        // if (typeof Buffer !== 'undefined') {
        if (global.process && global.process.versions.node) {
            // running on Node
            return Buffer.from(uuid_parse.parse(value));
        } else {
            // running in Browser
            return new Uint8Array(uuid_parse.parse(value));
        }

    } else {
        // generate a new UUID

        // if (typeof Buffer !== 'undefined') {
        if (global.process && global.process.versions.node) {
            // running on Node
            const buffer = [];
            _uuid.v4(null, buffer);
            return Buffer.from(buffer);
        } else {
            // running in Browser
            const buffer = [];
            _uuid.v4(null, buffer);
            return new Uint8Array(buffer);
        }
    }
}


function without0x (string) {
    assert(typeof string === 'string', 'Input must be a string')

    if (string.startsWith("0x")) {
        return string.substring(2);
    }

    return string;
}


function with0x (string) {
    assert(typeof string === 'string', 'Input must be a string')

    if (!string.startsWith("0x")) {
        return '0x' + string;
    }

    return string;
}


exports.pack_uint256 = pack_uint256;
exports.unpackUint256 = unpackUint256;
exports.uuid = uuid;
exports.without0x = without0x;
exports.with0x = with0x;
