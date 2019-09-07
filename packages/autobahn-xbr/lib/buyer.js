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
    this.message = "failed to buy key " + key_id.toString('hex') + ": price of " + price + " exceeds configured buyer maximum price " + max_price;
    this.error = "xbr.error.max_price_exceeded";
}


function ErrorInsufficientBalance (key_id, channel_adr, remaining, required) {
    this.message = "failed to buy key " + key_id.toString('hex') + ": remaining balance " + remaining + " in payment channel " + channel_adr + " insufficient - required minimum of " + required;
    this.error = "xbr.error.insufficient_balance";
}


SimpleBuyer.prototype.unwrap = async function (key_id, enc_ser, ciphertext) {
    self = this;
    var d = self._deferred_factory();
    if (!self._keys.hasOwnProperty(key_id)) {
        self._keys[key_id] = false;

        // get (current) price for key we want to buy
        const quote = await self._session.call('xbr.marketmaker.get_quote', [key_id]);

        const amount = Number(quote.price);

        if (amount > Number(self._max_price)) {
            throw new ErrorMaxPriceExceeded(key_id, amount, Number(self._max_price))
        }

        const balance = self._balance_dec - BigInt(amount);

        console.log(amount, balance);

        if (balance < 0) {
            if (self._auto_close_channel) {
                const channel_adr = self._channel_adr;
                const close_seq = self._seq;
                const close_balance = 0; // Number(self._balance_dec);
                const close_is_final = true;

                console.log("CLOSE_CHANNEL", channel_adr, close_seq, close_balance, close_is_final);
                const signature = eip712.sign_eip712_data(self._pkey_raw, channel_adr, close_seq, close_balance, close_is_final);

                await self._session.call('xbr.marketmaker.close_channel', [self._channel_adr_raw, close_seq, close_balance, close_is_final, signature]);

                throw new ErrorInsufficientBalance(key_id, self._channel_adr, self._balance_dec, amount);

            } else {
                throw new ErrorInsufficientBalance(key_id, self._channel_adr, self._balance_dec, amount);
            }
        }

        console.log('key 0x' + key_id.toString('hex') + ' costs ' + quote + ' XBR');

        const delegate_adr = self._addr;
        const buyer_pubkey = self._receive_key.publicKey;
        const channel_adr = self._channel_adr;
        const channel_seq = self._seq;
        //const amount = Number(self._max_price);
        const balance2 = 0; //Number(self._balance_dec);
        const is_final = false;

        console.log(channel_adr, channel_seq, 0, is_final);

        const signature = eip712.sign_eip712_data(self._pkey_raw, channel_adr, channel_seq, balance2, is_final);

        self._session.call(
            'xbr.marketmaker.buy_key',
            [delegate_adr, buyer_pubkey, key_id, self._channel_adr_raw, channel_seq, amount, balance2, signature]
        ).then(
            function (receipt) {
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
                console.log(error);
                if (error.error === 'xbr.error.insufficient_payment_balance') {
                    const channel_adr = self._channel_adr;
                    const close_seq = self._seq;
                    const close_balance = 0; // Number(self._balance_dec);
                    const close_is_final = true;

                    console.log("CLOSE_CHANNEL", channel_adr, close_seq, close_balance, close_is_final);
                    const signature = eip712.sign_eip712_data(self._pkey_raw, channel_adr, close_seq, close_balance, close_is_final);

                    await self._session.call('xbr.marketmaker.close_channel', [self._channel_adr_raw, close_seq, close_balance, close_is_final, signature]);
                }
                d.reject(error.error);
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
