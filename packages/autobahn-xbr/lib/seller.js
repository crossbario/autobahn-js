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

const autobahn = require('autobahn');
const eth_accounts = require("web3-eth-accounts");
const eth_util = require("ethereumjs-util");
const nacl = require('tweetnacl');
const web3 = require('web3');
const BN = web3.utils.BN;

const key_series = require('./keyseries');
const util = require('./util.js');
const eip712 = require('./eip712.js');


let Seller = function (market_maker_adr, seller_key) {
    self = this;

    self._acct = new eth_accounts().privateKeyToAccount(seller_key);

    self._market_maker_adr = eth_util.toBuffer(market_maker_adr);
    self._pkey_raw = eth_util.toBuffer(util.with_0x(seller_key));
    self.seller_key = seller_key;
    self.keys = {};
    self.keysMap = {};
    self._provider_id = eth_util.bufferToHex(eth_util.privateToPublic(self._pkey_raw));
    self._session = null;
    self._session_regs = [];
    self._deferred_factory = autobahn.util.deferred_factory();

    self._addr = eth_util.toBuffer(self._acct.address);
};


Seller.prototype.start = async function (session) {
    self._session = session;

    let d = self._deferred_factory();

    try {
        self._channel = await session.call('xbr.marketmaker.get_active_paying_channel', [self._addr]);
        console.log(self._channel)
        self._channel_oid = self._channel.channel_oid;
        self._seq = self._channel.seq;

        let procedure = `xbr.provider.${self._provider_id}.sell`
        let reg = await session.register(procedure, self.sell);

        for (let key in self.keys) {
            await self.keys[key].start();
        }

        self._xbrmm_config = await session.call('xbr.marketmaker.get_config');
        self._xbrmm_status = await session.call('xbr.marketmaker.get_status');

        let paying_balance = await session.call('xbr.marketmaker.get_paying_channel_balance', [self._channel_oid]);
        console.log(paying_balance.remaining, "APY")
        self._balance = new BN(paying_balance.remaining);
        console.log(self._balance.div(new BN('1000000000000000000')).toString())
        return new BN(paying_balance.remaining);
    } catch (e) {
        d.reject(e);
        return autobahn.util.promise(d);
    }
};


Seller.prototype.sell = function (args) {

    let [market_maker_adr, buyer_pubkey, key_id, channel_oid, channel_seq, amount_, balance_, signature] = args;

    // console.log('SELL', market_maker_adr, buyer_pubkey, key_id, channel_adr, channel_seq, amount_, balance_, signature);

    // FIXME: check market maker signature

    const amount = new BN(amount_);
    const balance = new BN(balance_);

    // check that the market_maker_adr fits what we expect for the market maker
    if (Buffer.compare(market_maker_adr, self._market_maker_adr) !== 0) {
        throw "xbr.error.unexpected_marketmaker_adr";
    }

    // check the key exists
    if (!self.keysMap.hasOwnProperty(key_id)) {
        // crossbar.error.no_such_object
        throw "no key with ID " + key_id;
    }

    // FIXME: must be the currently active channel .. and we need to track all of these
    if (Buffer.compare(channel_oid, self._channel.channel_oid) !== 0) {
        throw "xbr.error.unexpected_channel_adr";
    }

    // check that we agree on what the market maker state provides (amount, balance, seq):

    // FIXME: check amount == quote price for key

    // channel sequence number: check we have consensus on off-chain channel state with peer (which is the market maker)
    // if (channel_seq !== self._seq + 1) {
    //     throw "xbr.error.unexpected_channel_seq";
    // }

    // channel balance: check we have consensus on off-chain channel state with peer (which is the market maker)
    if (!balance.eq(self._balance.sub(amount))) {
        throw "xbr.error.unexpected_channel_balance";
    }

    console.log(self._balance.div(new BN('1000000000000000000')))
    // ok, we agree with the market maker about the off-chain state .. advance state
    // FIXME: rollback to previous state when the code below fails
    self._seq += channel_seq
    self._balance = self._balance.sub(amount)

    let verifying_contract = self._xbrmm_config.verifying_contract_adr;
    let chain_id = self._xbrmm_config.chain;
    let block_number = self._xbrmm_status.block.number;
    let market_oid = util.with_0x(autobahn.util.btoh(self._channel.market_oid));
    let channel_id = util.with_0x(autobahn.util.btoh(self._channel_oid));

    // XBRSIG[5/8]: compute EIP712 typed data signature
    let seller_signature = eip712.sign_eip712_data(self._pkey_raw, chain_id, verifying_contract, block_number,
        market_oid, channel_id, self._seq, self._balance, false);

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
        'amount': util.pack_uint256(amount),

        // paying channel amount remaining
        'balance': self._balance,

        // seller (delegate) signature
        'signature': seller_signature,
    }

    console.log(' SimpleSeller.sell() - XBR SELL   key 0x' + key_id.toString('hex') + ' sold for ' + amount.div(eip712.decimals) + ' XBR [paying_channel=' + self._channel_adr + ', remaining=' + self._balance.div(eip712.decimals) + ' XBR]');

    return seller_receipt
};


Seller.prototype.on_channel_closed = function (args) {

    let [paying_channel_adr, channel_seq, channel_balance, channel_is_final] = args;

    console.log('ON_CHANNEL_CLOSED', paying_channel_adr, channel_seq, channel_balance, channel_is_final);

    self._session.leave();
}


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
        'balance': util.pack_uint256(channel_balance),
        'is_final': channel_is_final,
        'signature': seller_signature,
    }

    console.log(' SimpleSeller.close_channel() - XBR CLOSE closing channel 0x' + channel_adr.toString('hex') + ', closing balance ' + channel_balance.div(eip712.decimals) + ', closing sequence ' + channel_seq);

    return receipt;
}


Seller.prototype.add = function (api_id, prefix, price, interval) {

    self = this;

    function rotate (series) {

        self.keysMap[series.key_id] = series;

        const key_id = series.key_id;
        const api_id = series.api_id;
        const uri = series.prefix;

        // FIXME
        //const valid_from = BigInt(Date.now() * 1000000 - 10 * 10 ** 9);
        const valid_from = 0;

        const delegate_adr = self._addr;

        // FIXME: sign the offer
        const delegate_signature = nacl.randomBytes(65);

        // const privkey = null;
        const price = series.price;
        // const categories = null;
        // const expires = null;
        // const copies = null;
        const provider_id = self._provider_id;

        console.log("Placing offer for key ..", key_id);

        // offer the key for sale with the market maker
        self._session.call(
            'xbr.marketmaker.place_offer',
            [key_id, api_id, uri, valid_from, delegate_adr, delegate_signature],
            {price: util.pack_uint256(price), provider_id: provider_id}
        ).then(
            function (result) {
                console.log("Offer placed for key:", result['key']);
            },
            function (error) {
                console.log("Call failed:", error);
            }
        )
    }

    let series = new key_series.KeySeries(api_id, prefix, price, interval, rotate);

    self.keys[api_id] = series;

    return series;
};


Seller.prototype.stop = function () {

    for (let key in self.keys) {
        self.keys[key].stop()
    }

    for (let i = 0; i < self._session_regs.length; i++) {
        self._session_regs[i].unregister()
    }
};


Seller.prototype.wrap = function (api_id, uri, payload) {

    return self.keys[api_id].encrypt(payload)
};

exports.SimpleSeller = Seller;
