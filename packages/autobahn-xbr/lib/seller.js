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


class SimpleSeller {
    constructor(market_maker_adr, seller_key) {
        this._acct = new eth_accounts().privateKeyToAccount(seller_key);

        this._market_maker_adr = eth_util.toBuffer(market_maker_adr);
        this._pkey_raw = eth_util.toBuffer(util.with_0x(seller_key));
        this.seller_key = seller_key;
        this.keys = {};
        this.keysMap = {};
        this._provider_id = eth_util.bufferToHex(eth_util.privateToPublic(this._pkey_raw));
        this._session = null;
        this._session_regs = [];
        this._deferred_factory = autobahn.util.deferred_factory();

        this._addr = eth_util.toBuffer(this._acct.address);
    }

    async start(session) {
        this._session = session;

        let d = this._deferred_factory();

        try {
            this._channel = await session.call('xbr.marketmaker.get_active_paying_channel', [this._addr]);
            this._channel_oid = this._channel.channel_oid;

            let procedure = `xbr.provider.${this._provider_id}.sell`
            let reg = await session.register(procedure, this.sell.bind(this));

            for (let key in this.keys) {
                await this.keys[key].start();
            }

            this._xbrmm_config = await session.call('xbr.marketmaker.get_config');
            this._xbrmm_status = await session.call('xbr.marketmaker.get_status');

            let paying_balance = await session.call('xbr.marketmaker.get_paying_channel_balance', [this._channel_oid]);
            this._balance = new BN(paying_balance.remaining);
            this._seq = paying_balance.seq;
            return new BN(paying_balance.remaining);
        } catch (e) {
            d.reject(e);
            return autobahn.util.promise(d);
        }
    }

    sell(args) {
        let [market_maker_adr, buyer_pubkey, key_id, channel_oid, channel_seq, amount_, balance_, signature] = args;

        // console.log('SELL', market_maker_adr, buyer_pubkey, key_id, channel_oid, channel_seq, amount_, balance_, signature);

        // FIXME: check market maker signature

        const amount = new BN(amount_);
        const balance = new BN(balance_);

        // check that the market_maker_adr fits what we expect for the market maker
        if (Buffer.compare(market_maker_adr, this._market_maker_adr) !== 0) {
            throw "xbr.error.unexpected_marketmaker_adr";
        }

        // check the key exists
        if (!this.keysMap.hasOwnProperty(key_id)) {
            // crossbar.error.no_such_object
            throw "no key with ID " + key_id;
        }

        // FIXME: must be the currently active channel .. and we need to track all of these
        if (Buffer.compare(channel_oid, this._channel.channel_oid) !== 0) {
            throw "xbr.error.unexpected_channel_adr";
        }

        // check that we agree on what the market maker state provides (amount, balance, seq):

        // FIXME: check amount == quote price for key

        // channel sequence number: check we have consensus on off-chain channel state with peer (which is the market maker)
        if (channel_seq !== this._seq + 1) {
            throw "xbr.error.unexpected_channel_seq";
        }

        // channel balance: check we have consensus on off-chain channel state with peer (which is the market maker)
        if (!balance.eq(this._balance.sub(amount))) {
            throw "xbr.error.unexpected_channel_balance";
        }

        let verifying_contract = this._xbrmm_config.verifying_contract_adr;
        let chain_id = this._xbrmm_config.verifying_chain_id;
        // FIXME
        let block_number = 1;

        let signer_address = eip712.recover_eip712_signer(chain_id, verifying_contract, block_number,
            this._channel.market_oid, this._channel_oid, channel_seq, balance, false, signature);

        let signer_address_raw = autobahn.util.htob(util.without_0x(signer_address));
        if (Buffer.compare(signer_address_raw, market_maker_adr)) {
            throw "xbr.error.bad_maker_signature";
        }

        // FIXME: rollback to previous state when the code below fails
        this._seq += 1;
        this._balance = this._balance.sub(amount);

        // XBRSIG[5/8]: compute EIP712 typed data signature
        let seller_signature = eip712.sign_eip712_data(this._pkey_raw, chain_id, verifying_contract, block_number,
            this._channel.market_oid, this._channel_oid, this._seq, this._balance, false);

        // now seal (end-to-end encrypt) the data encryption key to the public (Ed25519) key of the buyer delegate
        const sealed_key = this.keysMap[key_id].encryptKey(key_id, buyer_pubkey)

        // assemble receipt for the market maker
        let seller_receipt = {
            // key ID that has been bought
            'key_id': key_id,

            // seller delegate address that sold the key
            'delegate': this._addr,

            // buyer delegate Ed25519 public key with which the bought key was sealed
            'buyer_pubkey': buyer_pubkey,

            // finally return what the consumer (buyer) was actually interested in:
            // the data encryption key, sealed (public key Ed25519 encrypted) to the
            // public key of the buyer delegate
            'sealed_key': sealed_key,

            // paying channel off-chain transaction sequence numbers
            'channel_seq': this._seq,

            // amount paid for the key
            'amount': util.pack_uint256(amount),

            // paying channel amount remaining
            'balance': util.pack_uint256(this._balance),

            // seller (delegate) signature
            'signature': seller_signature,
        }

        console.log(' SimpleSeller.sell() - XBR SELL   key 0x' + key_id.toString('hex') + ' sold for ' + amount.div(eip712.decimals) + ' XBR [paying_channel=' + this._channel_adr + ', remaining=' + this._balance.div(eip712.decimals) + ' XBR]');

        return seller_receipt;
    }

    on_channel_closed(args) {

        let [paying_channel_adr, channel_seq, channel_balance, channel_is_final] = args;

        console.log('ON_CHANNEL_CLOSED', paying_channel_adr, channel_seq, channel_balance, channel_is_final);

        this._session.leave();
    }

    close_channel(args) {
        let [market_maker_adr, channel_adr, channel_seq, channel_balance_, channel_is_final, marketmaker_signature] = args;

        console.log('CLOSE_CHANNEL', market_maker_adr, channel_adr, channel_seq, channel_balance_, channel_is_final, marketmaker_signature);

        // FIXME: check market maker signature

        const channel_balance = new BN(channel_balance_);

        // check that the market_maker_adr fits what we expect for the market maker
        if (Buffer.compare(market_maker_adr, this._market_maker_adr) !== 0) {
            throw "xbr.error.unexpected_marketmaker_adr";
        }

        // FIXME: must be the currently active channel .. and we need to track all of these
        if (Buffer.compare(channel_adr, this._channel.channel_oid) !== 0) {
            throw "xbr.error.unexpected_channel_adr";
        }

        // check that we agree on what the market maker state provides (balance, seq):

        // channel sequence number: check we have consensus on off-chain channel state with peer (which is the market maker)
        if (channel_seq !== this._seq) {
            throw "xbr.error.unexpected_channel_seq";
        }

        // channel balance: check we have consensus on off-chain channel state with peer (which is the market maker)
        if (!channel_balance.eq(this._balance)) {
            throw "xbr.error.unexpected_channel_balance";
        }

        let verifying_contract = this._xbrmm_config.verifying_contract_adr;
        let chain_id = this._xbrmm_config.verifying_chain_id;
        // FIXME
        let block_number = 1;

        // XBRSIG: compute EIP712 typed data signature
        let seller_signature = eip712.sign_eip712_data(this._pkey_raw, chain_id, verifying_contract, block_number,
            this._channel.market_oid, this._channel_oid, this._seq, this._balance, channel_is_final);

        let receipt = {
            'delegate': this._addr,
            'seq': channel_seq,
            'balance': util.pack_uint256(channel_balance),
            'is_final': channel_is_final,
            'signature': seller_signature,
        }

        console.log(' SimpleSeller.close_channel() - XBR CLOSE closing channel 0x' + channel_adr.toString('hex') + ', closing balance ' + channel_balance.div(eip712.decimals) + ', closing sequence ' + channel_seq);

        return receipt;
    }

    add(api_id, prefix, price, interval) {
        const rotate = (series) => {

            this.keysMap[series.key_id] = series;

            const key_id = series.key_id;
            const api_id = series.api_id;
            const uri = series.prefix;

            // FIXME
            //const valid_from = BigInt(Date.now() * 1000000 - 10 * 10 ** 9);
            const valid_from = 0;

            const delegate_adr = this._addr;

            // FIXME: sign the offer
            const delegate_signature = nacl.randomBytes(65);

            // const privkey = null;
            const price = series.price;
            // const categories = null;
            // const expires = null;
            // const copies = null;
            const provider_id = this._provider_id;

            console.log("Placing offer for key ..", key_id);

            // offer the key for sale with the market maker
            this._session.call(
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

        this.keys[api_id] = series;

        return series;
    }

    stop() {
        for (let key in this.keys) {
            this.keys[key].stop()
        }

        for (let i = 0; i < this._session_regs.length; i++) {
            this._session_regs[i].unregister()
        }
    }

    wrap(api_id, uri, payload) {
        return this.keys[api_id].encrypt(payload);
    }
}

exports.SimpleSeller = SimpleSeller;
