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

var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");
var key_series = require('./keyseries');
var nacl = require('tweetnacl');
var util = require('./util.js');
var eip712 = require('./eip712.js');
var w3_utils = require("web3-utils");
var web3 = require('web3');
var BN = web3.utils.BN;


var Seller = function (market_maker_adr, seller_key) {
    self = this;

    self._market_maker_adr = eth_util.toBuffer(market_maker_adr);
    self.seller_key = seller_key;
    self.keys = {};
    self.keysMap = {};
    self._providerID = eth_util.bufferToHex(eth_util.privateToPublic(seller_key));
    self._session = null;
    self.sessionRegs = [];
    self._deferred_factory = util.deferred_factory();

    self._pkey_raw = eth_util.toBuffer(seller_key);
    self._acct = new eth_accounts().privateKeyToAccount(seller_key);
    self._addr = eth_util.toBuffer(self._acct.address);
};

Seller.prototype.start = function (session) {
    self._session = session;

    var d = self._deferred_factory();

    session.call('xbr.marketmaker.get_active_paying_channel', [self._addr]).then(
        function (channel) {
            self._channel = channel;
            self._channel_adr_raw = channel.channel;
            self._channel_adr = w3_utils.toChecksumAddress(channel.channel.toString("hex"));

            session.call('xbr.marketmaker.get_paying_channel_balance', [channel.channel]).then(
                function (balance) {
                    self._balance = new BN(balance.remaining);
                    self._seq = balance.seq;

                    const procedure = 'xbr.provider.' + self._providerID + '.sell';
                    session.register(procedure, self.sell).then(
                        function (registration) {
                            self.sessionRegs.push(registration);
                            for (var key in self.keys) {
                                self.keys[key].start();
                            }
                            d.resolve(self._balance);
                        },
                        function (error) {
                            console.log("Registration failed:", error);
                            d.reject(error);
                        }
                    );
                },
                function (error) {
                    console.log("get_paying_channel_balance failed:", error);
                    d.reject(error);
                }
            );
        },
        function (error) {
            console.log("get_active_paying_channel failed:", error);
            d.reject(error);
        }
    );

    return util.promise(d);
};

// def sell(self, market_maker_adr, buyer_pubkey, key_id, channel_adr, channel_seq, amount, balance, signature, details=None):
Seller.prototype.sell = function (args) {
    //const self = this;

    let [market_maker_adr, buyer_pubkey, key_id, channel_adr, channel_seq, amount_, balance_, signature] = args;
    console.log(market_maker_adr, buyer_pubkey, key_id, channel_adr, channel_seq, amount_, balance_, signature);

    // FIXME: check market maker signature
    // FIXME: check that we agree on what the market maker state provides (amount, balance, seq)

    const amount = new BN(amount_);
    const balance = new BN(balance_);

    // check that the delegate_adr fits what we expect for the market maker
    if (Buffer.compare(market_maker_adr, self._market_maker_adr) != 0) {
        throw "xbr.error.unexpected_marketmaker_adr";
    }

    // check the key exists
    if (!self.keysMap.hasOwnProperty(key_id)) {
        // crossbar.error.no_such_object
        throw "no key with ID " + key_id;
    }

    // FIXME: must be the currently active channel .. and we need to track all of these
    if (Buffer.compare(channel_adr, self._channel.channel) != 0) {
        throw "xbr.error.unexpected_channel_adr";
    }

    // channel sequence number: check we have consensus on off-chain channel state with peer (which is the market maker)
    if (channel_seq != self._seq + 1) {
        throw "xbr.error.unexpected_channel_seq";
    }

    // channel balance: check we have consensus on off-chain channel state with peer (which is the market maker)
    if (!balance.eq(self._balance.sub(amount))) {
        throw "xbr.error.unexpected_channel_balance";
    }

    self._seq += 1
    self._balance = self._balance.sub(amount)

    // XBRSIG[5/8]: compute EIP712 typed data signature
    seller_signature = eip712.sign_eip712_data(self._pkey_raw, self._channel_adr, self._seq, self._balance, false);

    sealed_key = self.keysMap[key_id].encryptKey(key_id, buyer_pubkey)

    seller_receipt = {
        // key ID that has been bought
        'key_id': key_id,

        // seller delegate address that sold the key
        'delegate': self._addr,

        // buyer delegate Ed25519 public key with which the bought key was sealed
        'buyer_pubkey': buyer_pubkey,

        // finally return what the consumer (buyer) was actually interested in:
        // the data encryption key, sealed (public key Ed25519 encrypted) to the
        // public key of the buyer delegate
        'sealed_key': sealed_key,

        // paying channel off-chain transaction sequence numbers
        'channel_seq': self._seq,

        // amount paid for the key
        'amount': amount.toBuffer('big', 32),

        // paying channel amount remaining
        'balance': self._balance.toBuffer('big', 32),

        // seller (delegate) signature
        'signature': seller_signature,
    }

    return seller_receipt
};

Seller.prototype.add = function (apiID, prefix, price, interval) {

    function rotate (series) {

        self.keysMap[series.keyID] = series;

        const key_id = series.keyID;
        const api_id = series.apiID;
        const uri = series.prefix;
        const valid_from = BigInt(Date.now() * 1000000 - 10 * 10 ** 9);
        const delegate_adr = self._addr;
        const delegate_signature = nacl.randomBytes(65);
        // const privkey = null;
        const price = series.price;
        // const categories = null;
        // const expires = null;
        // const copies = null;
        const provider_id = self._providerID;
        self._session.call(
            'xbr.marketmaker.place_offer',
            [key_id, api_id, uri, valid_from, delegate_adr, delegate_signature],
            {price: price.toBuffer('big', 32), provider_id: provider_id}
        ).then(
            function (result) {
                console.log("Offer placed for key", result['key']);
            },
            function (error) {
                console.log("Call failed:", error);
            }
        )
    };

    var keySeries = new key_series.KeySeries(apiID, prefix, price, interval, rotate);
    self.keys[apiID] = keySeries;

    return keySeries;
};

Seller.prototype.stop = function () {

    for (var key in self.keys) {
        self.keys[key].stop()
    }

    for (var i = 0; i < self.sessionRegs.length; i++) {
        self.sessionRegs[i].unregister()
    }
};

Seller.prototype.wrap = function (api_id, uri, payload) {

    return self.keys[api_id].encrypt(payload)
};

exports.SimpleSeller = Seller;
