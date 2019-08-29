///////////////////////////////////////////////////////////////////////////////
//
//  XBR Open Data Markets - https://xbr.network
//
//  JavaScript client library for the XBR Network.
//
//  Copyright (C) Crossbar.io Technologies GmbH and contributors
//
//  Licensed under the Apache 2.0 License:
//  https://opensource.org/licenses/Apache-2.0
//
///////////////////////////////////////////////////////////////////////////////

var cbor = require('cbor');
var nacl = require('tweetnacl');
nacl.sealedbox = require('tweetnacl-sealedbox-js');
var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");
var util = require('./util.js');


var SimpleBuyer = function (buyerKey, maxPrice) {
    this._running = false;
    this._session = null;
    this._channel = null;
    this._balance = null;
    this._keys = {};
    this._maxPrice = maxPrice;
    this._deferred_factory = util.deferred_factory();

    var account = new eth_accounts().privateKeyToAccount(buyerKey);
    this._addr = eth_util.toBuffer(account.address);

    this._keyPair = nacl.box.keyPair();
};

SimpleBuyer.prototype.start = function(session, consumerID) {
    self = this;
    self._session = session;
    self._running = true;

    var d = this._deferred_factory();

    session.call('xbr.marketmaker.get_payment_channel', [self._addr]).then(
        function (paymentChannel) {
            self._channel = paymentChannel;
            self._balance = paymentChannel['remaining'];
            d.resolve(self._balance);
        },
        function (error) {
            console.log("Call failed:", error);
            d.reject(error['error']);
        }
    );

    return util.promise(d);
};

SimpleBuyer.prototype.stop = function () {
    this._running = false;
};

SimpleBuyer.prototype.balance = function () {
    var d = this._deferred_factory();
    this._session.call('xbr.marketmaker.get_payment_channel', [self._addr]).then(
        function (paymentChannel) {
            var balance = {
                amount: paymentChannel['amount'],
                remaining: paymentChannel['remaining'],
                inflight: paymentChannel['inflight']
            };
            d.resolve(balance);
        },
        function (error) {
            console.log("Call failed:", error);
            d.reject(error['error']);
        }
    );
    return util.promise(d);
};

SimpleBuyer.prototype.openChannel = function (buyerAddr, amount) {
    var signature = nacl.randomBytes(64);
    var d = this._deferred_factory();
    this._session.call(
        'xbr.marketmaker.open_payment_channel',
        [buyerAddr, this._addr, amount, signature]
    ).then(
        function (paymentChannel) {
            var balance = {
                amount: paymentChannel['amount'],
                remaining: paymentChannel['remaining'],
                inflight: paymentChannel['inflight']
            };
            d.resolve(balance);
        },
        function (error) {
            console.log("Call failed:", error);
            d.reject(error['error']);
        }
    );
    return util.promise(d);
};

SimpleBuyer.prototype.closeChannel = function () {
};

var decryptPayload = function(ciphertext, key, d) {
    try {
        var nonce = ciphertext.slice(0, nacl.secretbox.nonceLength);
        var message = ciphertext.slice(nacl.secretbox.nonceLength, ciphertext.length);
        var decrypted = Buffer.from(nacl.secretbox.open(message, nonce, key));
        var payload = cbor.decode(decrypted);
        d.resolve(payload);
    } catch (e) {
        d.reject(e)
    }
};

SimpleBuyer.prototype.unwrap = function (keyID, ciphertext) {
    self = this;
    var d = self._deferred_factory();
    if (!self._keys.hasOwnProperty(keyID)) {
        self._keys[keyID] = false;
        self._session.call(
            'xbr.marketmaker.buy_key',
            [self._addr, self._keyPair.publicKey, keyID, self._maxPrice, nacl.randomBytes(64)]
        ).then(
            function (receipt) {
                var sealedKey = receipt['sealed_key'];
                try {
                    self._keys[keyID] = nacl.sealedbox.open(sealedKey, self._keyPair.publicKey,
                        self._keyPair.secretKey);
                    decryptPayload(ciphertext, self._keys[keyID], d);
                } catch (e) {
                    d.reject(e)
                }
            },
            function (error) {
                d.reject(error['error'])
            }
        );
    } else {
        var waitForPurchase = function() {
            if (!self._keys[keyID]) {
                setTimeout(waitForPurchase, 200)
            } else {
                decryptPayload(ciphertext, self._keys[keyID], d);
            }
        };
        waitForPurchase()
    }
    return util.promise(d);
};

exports.SimpleBuyer = SimpleBuyer;
