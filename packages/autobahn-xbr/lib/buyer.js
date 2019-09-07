///////////////////////////////////////////////////////////////////////////////
//
//  XBR Open Data Markets - https://xbr.network
//
//  JavaScript client library for the XBR Network.
//
//  Copyright (C) Crossbar.io Technologies GmbH and contributors
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var cbor = require('cbor');
var nacl = require('tweetnacl');
nacl.sealedbox = require('tweetnacl-sealedbox-js');
var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");
var util = require('./util.js');
var eip712 = require('./eip712.js');
var w3_utils = require("web3-utils");

var SimpleBuyer = function (marketMakerAdr, buyerKey, maxPrice) {
    self = this;

    self._running = false;
    self._session = null;
    self._channel = null;
    self._balance = null;
    self._keys = {};
    self._marketMakerAdr = marketMakerAdr;
    self._maxPrice = maxPrice;
    self._deferred_factory = util.deferred_factory();

    self._pkey_raw = eth_util.toBuffer(buyerKey);
    self._acct = new eth_accounts().privateKeyToAccount(buyerKey);
    self._addr = eth_util.toBuffer(self._acct.address);

    self._keyPair = nacl.box.keyPair();
};

SimpleBuyer.prototype.start = function(session, consumerID) {
    self = this;
    self._session = session;
    self._running = true;
    self._channel = null;
    self._channel_adr = null;
    self._balance = null;
    self._seq = null;

    var d = this._deferred_factory();

    session.call('xbr.marketmaker.get_active_payment_channel', [self._addr]).then(
        function (paymentChannel) {
            console.log(paymentChannel);
            self._channel = paymentChannel;
            //self._channel_adr = eth_util.toBuffer(paymentChannel['channel']);
            self._channel_adr_raw = paymentChannel['channel'];
            //self._channel_adr = paymentChannel['channel'].toString("hex");
            self._channel_adr = w3_utils.toChecksumAddress(paymentChannel['channel'].toString("hex"));


            session.call('xbr.marketmaker.get_payment_channel_balance', [paymentChannel['channel']]).then(
                function (paymentBalance) {
                    console.log(paymentBalance);
                    self._balance_raw = paymentBalance['remaining'];
                    self._balance_dec = BigInt('0x' + paymentBalance['remaining'].toString("hex"));
                    self._seq = paymentBalance['seq'];
                    d.resolve(self._balance_dec);
                },
                function (error) {
                    console.log("Call failed:", error);
                    d.reject(error['error']);
                }
            );
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
    this._session.call('xbr.marketmaker.get_payment_channel', [self._channel['channel']]).then(
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

        const delegate_adr = self._addr;
        const buyer_pubkey = self._keyPair.publicKey;
        const key_id = keyID;
        const channel_adr = self._channel_adr;
        const channel_seq = self._seq;
        const amount = Number(self._maxPrice);
        const balance = 0; //Number(self._balance_dec);
        const is_final = false;

        console.log(channel_adr, channel_seq, balance, is_final);

        const signature = eip712.sign_eip712_data(self._pkey_raw, channel_adr, channel_seq, balance, is_final);

        self._session.call(
            'xbr.marketmaker.buy_key',
            [delegate_adr, buyer_pubkey, key_id, self._channel_adr_raw, channel_seq, amount, balance, signature]
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
