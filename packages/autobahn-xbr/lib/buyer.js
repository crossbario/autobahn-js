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
var web3 = require('web3');
var BN = web3.utils.BN;

// https://www.npmjs.com/package/uuid
// const uuid = require('uuid/v4');
// var u = uuid();
// console.log(u);

const decimals = new BN('1000000000000000000');


var SimpleBuyer = function (market_maker_adr, buyer_key, max_price) {
    self = this;

    self._auto_close_channel = true;

    self._running = false;
    self._session = null;
    self._channel = null;
    self._balance = null;
    self._keys = {};
    self._market_maker_adr = market_maker_adr;
    self._max_price = max_price;
    self._deferred_factory = util.deferred_factory();

    self._pkey_raw = eth_util.toBuffer(buyer_key);
    self._acct = new eth_accounts().privateKeyToAccount(buyer_key);
    self._addr = eth_util.toBuffer(self._acct.address);

    self._receive_key = nacl.box.keyPair();
};

SimpleBuyer.prototype.start = function(session, consumerID) {
    self = this;
    self._session = session;
    self._running = true;
    self._channel = null;
    self._channel_adr = null;
    self._balance_raw = null;
    self._balance_dec = null;
    self._seq = null;

    var d = this._deferred_factory();

    session.call('xbr.marketmaker.get_active_payment_channel', [self._addr]).then(
        function (paymentChannel) {
            self._channel = paymentChannel;
            self._channel_adr_raw = paymentChannel.channel;
            self._channel_adr = w3_utils.toChecksumAddress(paymentChannel.channel.toString("hex"));

            session.call('xbr.marketmaker.get_payment_channel_balance', [paymentChannel.channel]).then(
                function (paymentBalance) {
                    self._balance = new BN(paymentBalance.remaining);
                    self._seq = paymentBalance.seq;
                    d.resolve(self._balance);
                },
                function (error) {
                    console.log("get_payment_channel_balance failed:", error);
                    d.reject(error);
                }
            );
        },
        function (error) {
            console.log("get_active_payment_channel failed:", error);
            d.reject(error);
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
    throw "not implemented";
};

var decrypt_payload = function(ciphertext, key) {
    var nonce = ciphertext.slice(0, nacl.secretbox.nonceLength);
    var message = ciphertext.slice(nacl.secretbox.nonceLength, ciphertext.length);
    var decrypted = Buffer.from(nacl.secretbox.open(message, nonce, key));
    var payload = cbor.decode(decrypted);
    return payload;
};


function ErrorMaxPriceExceeded (key_id, price, max_price) {
    this.message = "failed to buy key " + key_id.toString('hex') + ": price of " + price.toString() + " exceeds configured buyer maximum price " + max_price.toString();
    this.error = "xbr.error.max_price_exceeded";
}


function ErrorInsufficientBalance (key_id, channel_adr, remaining, required) {
    this.message = "failed to buy key " + key_id.toString('hex') + ": remaining balance " + remaining.toString() + " in payment channel " + channel_adr + " insufficient - required minimum of " + required.toString();
    this.error = "xbr.error.insufficient_balance";
}


SimpleBuyer.prototype.unwrap = async function (key_id, enc_ser, ciphertext) {
    self = this;
    var d = self._deferred_factory();
    if (!self._keys.hasOwnProperty(key_id)) {
        self._keys[key_id] = false;

        // get (current) price for key we want to buy
        const quote = await self._session.call('xbr.marketmaker.get_quote', [key_id]);

        // quoted price for key
        const amount = new BN(quote.price);

        // check quote price doesn't exceed the maximum amount we are willing to pay (per key)
        if (amount.gt(self._max_price)) {
            throw new ErrorMaxPriceExceeded(key_id, amount, self._max_price)
        }

        // compute balance remaining after purchase ..
        const balance = self._balance.sub(amount);

        // .. and check it's positive
        if (balance.isNeg()) {
            if (self._auto_close_channel) {
                // auto-close the payment channel
                const channel_adr = self._channel_adr;
                const close_seq = self._seq;
                const close_balance = self._balance;
                const close_is_final = true;
                const signature = eip712.sign_eip712_data(self._pkey_raw, channel_adr, close_seq, close_balance, close_is_final);

                console.log("auto-closing payment channel:", channel_adr, close_seq, close_balance.div(decimals), close_is_final);

                await self._session.call('xbr.marketmaker.close_channel', [self._channel_adr_raw,
                    close_seq, close_balance.toBuffer('big', 32), close_is_final, signature]);

                throw new ErrorInsufficientBalance(key_id, self._channel_adr, self._balance, amount);

            } else {
                throw new ErrorInsufficientBalance(key_id, self._channel_adr, self._balance, amount);
            }
        }

        // buy the key
        const delegate_adr = self._addr;
        const buyer_pubkey = self._receive_key.publicKey;
        const channel_adr = self._channel_adr;
        const channel_seq = self._seq;
        const is_final = false;
        const signature = eip712.sign_eip712_data(self._pkey_raw, channel_adr, channel_seq, balance, is_final);

        self._session.call('xbr.marketmaker.buy_key', [delegate_adr, buyer_pubkey, key_id, self._channel_adr_raw,
            channel_seq, amount.toBuffer('big', 32), balance.toBuffer('big', 32), signature]
        ).then(
            function (receipt) {
                // ok, we've got the key!
                const remaining = new BN(receipt.remaining);
                console.log(' SimpleBuyer.unwrap() - XBR BUY    key 0x' + key_id.toString('hex') + ' bought for ' + amount.div(decimals) + ' XBR [payment_channel=' + self._channel_adr + ', remaining=' + remaining.div(decimals) + ' XBR]');

                var sealedKey = receipt['sealed_key'];
                try {
                    self._keys[key_id] = nacl.sealedbox.open(sealedKey, self._receive_key.publicKey, self._receive_key.secretKey);
                    try {
                        const payload = decrypt_payload(ciphertext, self._keys[key_id]);
                        d.resolve(payload);
                    } catch (e) {
                        d.reject(e);
                    }
                } catch (e) {
                    d.reject(e)
                }
            },
            async function (error) {
                // failed to purchase the key
                if (error.error === 'xbr.error.insufficient_payment_balance') {
                    const channel_adr = self._channel_adr;
                    const close_seq = self._seq;
                    const close_balance = self._balance;
                    const close_is_final = true;
                    const signature = eip712.sign_eip712_data(self._pkey_raw, channel_adr, close_seq, close_balance, close_is_final);

                    console.log("auto-closing payment channel:", channel_adr, close_seq, close_balance, close_is_final);

                    await self._session.call('xbr.marketmaker.close_channel', [self._channel_adr_raw,
                        close_seq, close_balance.toBuffer('big', 32), close_is_final, signature]);
                }
                d.reject(error);
            }
        );
    } else {
        var waitForPurchase = function() {
            if (!self._keys[key_id]) {
                setTimeout(waitForPurchase, 200)
            } else {
                try {
                    const payload = decrypt_payload(ciphertext, self._keys[key_id]);
                    d.resolve(payload);
                } catch (e) {
                    d.reject(e);
                }
            }
        };
        waitForPurchase()
    }
    return util.promise(d);
};

exports.SimpleBuyer = SimpleBuyer;
