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

//const autobahn = require('autobahn');

const when = require('when');

const eth_accounts = require("web3-eth-accounts");
const eth_util = require("ethereumjs-util");
const nacl = require('tweetnacl');
const w3_utils = require("web3-utils");
const web3 = require('web3');
const BN = web3.utils.BN;

const key_series = require('./keyseries');
const util = require('./util.js');
const eip712 = require('./eip712.js');
const decimals = new BN('1000000000000000000');


var Seller = function (market_maker_adr, seller_key) {
    self = this;

    self._market_maker_adr = eth_util.toBuffer(market_maker_adr);
    self.seller_key = seller_key;
    self.keys = {};
    self.keysMap = {};
    self._provider_id = eth_util.bufferToHex(eth_util.privateToPublic(seller_key));
    self._session = null;
    self._session_regs = [];
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

                    var endpoints = {
                        sell: self.sell,
                        close_channel: self.close_channel
                    };

                    var pl1 = [];

                    for (var proc in endpoints) {
                        pl1.push(session.register('xbr.provider.' + self._provider_id + '.' + proc, endpoints[proc]));
                    }

                    when.all(pl1).then(
                        function (registrations) {
                            self._session_regs = registrations;
                            for (var key in self.keys) {
                                self.keys[key].start();
                            }
                            d.resolve(self._balance);
                        },
                        function (error) {
                            console.log("registration of seller delegate procedures failed:", error);
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


Seller.prototype.sell = function (args) {

    let [market_maker_adr, buyer_pubkey, key_id, channel_adr, channel_seq, amount_, balance_, signature] = args;

    // console.log('SELL', market_maker_adr, buyer_pubkey, key_id, channel_adr, channel_seq, amount_, balance_, signature);

    // FIXME: check market maker signature

    const amount = new BN(amount_);
    const balance = new BN(balance_);

    // check that the market_maker_adr fits what we expect for the market maker
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

    // check that we agree on what the market maker state provides (amount, balance, seq):

    // FIXME: check amount == quote price for key

    // channel sequence number: check we have consensus on off-chain channel state with peer (which is the market maker)
    if (channel_seq != self._seq + 1) {
        throw "xbr.error.unexpected_channel_seq";
    }

    // channel balance: check we have consensus on off-chain channel state with peer (which is the market maker)
    if (!balance.eq(self._balance.sub(amount))) {
        throw "xbr.error.unexpected_channel_balance";
    }

    // ok, we agree with the market maker about the off-chain state .. advance state
    // FIXME: rollback to previous state when the code below fails
    self._seq += 1
    self._balance = self._balance.sub(amount)

    // XBRSIG[5/8]: compute EIP712 typed data signature
    seller_signature = eip712.sign_eip712_data(self._pkey_raw, self._channel_adr, self._seq, self._balance, false);

    // now seal (end-to-end encrypt) the data encryption key to the public (Ed25519) key of the buyer delegate
    sealed_key = self.keysMap[key_id].encryptKey(key_id, buyer_pubkey)

    // assemble receipt for the market maker
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

    console.log(' SimpleSeller.sell() - XBR SELL   key 0x' + key_id.toString('hex') + ' sold for ' + amount.div(decimals) + ' XBR [paying_channel=' + self._channel_adr + ', remaining=' + self._balance.div(decimals) + ' XBR]');

    return seller_receipt
};


Seller.prototype.close_channel = function (args) {

    let [market_maker_adr, channel_adr, channel_seq, channel_balance_, channel_is_final, marketmaker_signature] = args;

    console.log('CLOSE_CHANNEL', market_maker_adr, channel_adr, channel_seq, channel_balance_, channel_is_final, marketmaker_signature);

    // FIXME: check market maker signature

    const channel_balance = new BN(channel_balance_);

    // check that the market_maker_adr fits what we expect for the market maker
    if (Buffer.compare(market_maker_adr, self._market_maker_adr) != 0) {
        throw "xbr.error.unexpected_marketmaker_adr";
    }

    // FIXME: must be the currently active channel .. and we need to track all of these
    if (Buffer.compare(channel_adr, self._channel.channel) != 0) {
        throw "xbr.error.unexpected_channel_adr";
    }

    // check that we agree on what the market maker state provides (balance, seq):

    // channel sequence number: check we have consensus on off-chain channel state with peer (which is the market maker)
    if (channel_seq != self._seq) {
        throw "xbr.error.unexpected_channel_seq";
    }

    // channel balance: check we have consensus on off-chain channel state with peer (which is the market maker)
    if (!channel_balance.eq(self._balance)) {
        throw "xbr.error.unexpected_channel_balance";
    }

    // XBRSIG: compute EIP712 typed data signature
    seller_signature = eip712.sign_eip712_data(self._pkey_raw, self._channel_adr, self._seq, self._balance, channel_is_final);

    receipt = {
        'delegate': self._addr,
        'seq': channel_seq,
        'balance': channel_balance.toBuffer('big', 32),
        'is_final': channel_is_final,
        'signature': seller_signature,
    }

    console.log(' SimpleSeller.close_channel() - XBR CLOSE closing channel 0x' + channel_adr.toString('hex') + ', closing balance ' + channel_balance.div(decimals) + ', closing sequence ' + channel_seq);

    return receipt;
}


Seller.prototype.add = function (api_id, prefix, price, interval) {

    self = this;

    function rotate (series) {

        self.keysMap[series.key_id] = series;

        const key_id = series.key_id;
        const api_id = series.api_id;
        const uri = series.prefix;
        const valid_from = BigInt(Date.now() * 1000000 - 10 * 10 ** 9);
        const delegate_adr = self._addr;

        // FIXME: sign the offer
        const delegate_signature = nacl.randomBytes(65);

        // const privkey = null;
        const price = series.price;
        // const categories = null;
        // const expires = null;
        // const copies = null;
        const provider_id = self._provider_id;

        // offer the key for sale with the market maker
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

    var series = new key_series.KeySeries(api_id, prefix, price, interval, rotate);

    self.keys[api_id] = series;

    return series;
};


Seller.prototype.stop = function () {

    for (var key in self.keys) {
        self.keys[key].stop()
    }

    for (var i = 0; i < self._session_regs.length; i++) {
        self._session_regs[i].unregister()
    }
};


Seller.prototype.wrap = function (api_id, uri, payload) {

    return self.keys[api_id].encrypt(payload)
};

exports.SimpleSeller = Seller;
