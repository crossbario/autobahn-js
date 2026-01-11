///////////////////////////////////////////////////////////////////////////////
//
//  XBR Open Data Markets - https://xbr.network
//
//  JavaScript client library for the XBR Network.
//
//  Copyright (C) typedef int GmbH and contributors
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var cbor = require('cbor');
var nacl = require('tweetnacl');
var sealedbox = require('tweetnacl-sealedbox-js');


var KeySeries = function(api_id, prefix, price, interval, on_rotate) {

    this.api_id = api_id;
    this.price = price;
    this.interval = interval;
    this.prefix = prefix;
    this.on_rotate = on_rotate;
    this._archive = {};
    this._started = false;
};


KeySeries.prototype.encrypt = function (payload) {

    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const box = nacl.secretbox(cbor.encode(payload), nonce, this._archive[this.key_id]);
    var ciphertext = new Uint8Array(nonce.length + box.length);

    ciphertext.set(nonce);
    ciphertext.set(box, nonce.length);

    return [this.key_id, 'cbor', ciphertext];
};


KeySeries.prototype.encryptKey = function(key_id, buyer_pubkey) {
    return sealedbox.seal(this._archive[key_id], buyer_pubkey)
};


KeySeries.prototype.start = function() {
    if (!this._started) {
        this._rotate(this);
        this._started = true;
    }
};


KeySeries.prototype._rotate = function (context) {
    context.key_id = Buffer.from(nacl.randomBytes(16));
    context._archive[context.key_id] = nacl.randomBytes(nacl.secretbox.keyLength);
    context.on_rotate(context);

    // rotate key every "interval" seconds
    // FIXME: make this to wait for the above on_rotate callback to finish
    setTimeout(context._rotate, context.interval * 1000, context);
};


KeySeries.prototype.stop = function() {
    if (this._started) {
        this._started = false;
    }
};


exports.KeySeries = KeySeries;
