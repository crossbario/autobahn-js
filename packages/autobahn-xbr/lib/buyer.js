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

const autobahn = require('autobahn');
const cbor = require('cbor');
const nacl = require('tweetnacl');
nacl.sealedbox = require('tweetnacl-sealedbox-js');
const eth_accounts = require("web3-eth-accounts");
const eth_util = require("ethereumjs-util");
const web3 = require('web3');
const BN = web3.utils.BN;

const util = require('./util.js');
const eip712 = require('./eip712.js');


let decrypt_payload = function(ciphertext, key) {
    let nonce = ciphertext.slice(0, nacl.secretbox.nonceLength);
    let message = ciphertext.slice(nacl.secretbox.nonceLength, ciphertext.length);
    let decrypted = Buffer.from(nacl.secretbox.open(message, nonce, key));
    return cbor.decode(decrypted);
};


class SimpleBuyer {
    constructor(market_maker_adr, buyer_key, max_price) {
        this._auto_close_channel = true;

        this._running = false;
        this._session = null;
        this._channel = null;
        this._balance = null;
        this._keys = {};
        this._market_maker_adr = market_maker_adr;
        this._max_price = max_price;
        this._deferred_factory = autobahn.util.deferred_factory();

        this._pkey_raw = eth_util.toBuffer(util.with_0x(buyer_key));
        this._acct = new eth_accounts().privateKeyToAccount(util.with_0x(buyer_key));
        this._addr = eth_util.toBuffer(this._acct.address);

        this._receive_key = nacl.box.keyPair();
    }

    async start(session, consumerID) {
        this._session = session;
        this._running = true;
        this._channel = null;
        this._channel_adr = null;
        this._balance_raw = null;
        this._balance_dec = null;
        this._seq = null;

        let d = this._deferred_factory();

        try {
            this._channel = await session.call('xbr.marketmaker.get_active_payment_channel', [this._addr]);
            this._channel_oid = this._channel.channel_oid;

            this._xbrmm_config = await session.call('xbr.marketmaker.get_config');
            this._xbrmm_status = await session.call('xbr.marketmaker.get_status');

            let payment_balance = await session.call('xbr.marketmaker.get_payment_channel_balance', [this._channel_oid]);
            let remaining = new BN(payment_balance.remaining);
            this._seq = payment_balance.seq;

            if (remaining.eq(new BN(0))) {
                d.reject(new Error("xbr.error.payment_channel_empty"));
            } else {
                this._balance = remaining;
                d.resolve(remaining);
            }
        } catch (e) {
            d.reject(e);
        }

        return autobahn.util.promise(d);
    }

    stop() {
        this._running = false;
    }

    async balance() {
        let d = this._deferred_factory();
        try {
            let paymentChannel = await this._session.call('xbr.marketmaker.get_payment_channel',
                [this._channel.channel_oid]);
            let balance = {
                amount: paymentChannel['amount'],
                remaining: paymentChannel['remaining'],
                inflight: paymentChannel['inflight']
            };
            d.resolve(balance);
        } catch (error) {
            console.log("Call failed:", error);
            d.reject(error['error']);
        }

        return autobahn.util.promise(d);
    }

    async openChannel(buyerAddr, amount) {
        let signature = nacl.randomBytes(64);
        let d = this._deferred_factory();
        try {
            let paymentChannel = await this._session.call('xbr.marketmaker.open_payment_channel',
                [buyerAddr, this._addr, amount, signature]);
            let balance = {
                amount: paymentChannel['amount'],
                remaining: paymentChannel['remaining'],
                inflight: paymentChannel['inflight']
            };
            d.resolve(balance);
        } catch (error) {
            console.log("Call failed:", error);
            d.reject(error['error']);
        }

        return autobahn.util.promise(d);
    }

    closeChannel() {
        throw "not implemented";
    }

    async unwrap(key_id, enc_ser, ciphertext) {

        let d = this._deferred_factory();
        if (!this._keys.hasOwnProperty(key_id)) {
            this._keys[key_id] = false;

            let verifying_contract = this._xbrmm_config.verifying_contract_adr;
            let chain_id = this._xbrmm_config.verifying_chain_id;
            // FIXME
            let block_number = 1;

            // get (current) price for key we want to buy
            const quote = await this._session.call('xbr.marketmaker.get_quote', [key_id]);

            // quoted price for key
            const amount = new BN(quote.price);

            // check quote price doesn't exceed the maximum amount we are willing to pay (per key)
            if (amount.gt(this._max_price)) {
                throw new this.ErrorMaxPriceExceeded(key_id, amount, this._max_price)
            }

            // compute balance remaining after purchase ..
            const balance = this._balance.sub(amount);

            // .. and check it's positive
            if (balance.isNeg()) {
                if (this._auto_close_channel) {
                    // auto-close the payment channel
                    const close_seq = this._seq;
                    const close_balance = this._balance;
                    const close_is_final = true;
                    const signature = eip712.sign_eip712_data(this._pkey_raw, chain_id, verifying_contract, block_number,
                        this._channel.market_oid, this._channel_oid, close_seq, close_balance, close_is_final);

                    console.log("auto-closing payment channel:", this._channel.market_oid, close_seq,
                        close_balance.div(eip712.decimals), close_is_final);

                    await this._session.call('xbr.marketmaker.close_channel', [this._channel.market_oid,
                        chain_id, verifying_contract, block_number, util.pack_uint256(close_balance), close_seq,
                        close_is_final, signature]);

                    throw new this.ErrorInsufficientBalance(key_id, this._channel_adr, this._balance, amount);

                } else {
                    throw new this.ErrorInsufficientBalance(key_id, this._channel_adr, this._balance, amount);
                }
            }

            // buy the key
            const delegate_adr = this._addr;
            const buyer_pubkey = this._receive_key.publicKey;
            const channel_seq = this._seq;
            const is_final = false;
            const signature = eip712.sign_eip712_data(this._pkey_raw, chain_id, verifying_contract, block_number,
                this._channel.market_oid, this._channel_oid, channel_seq, balance, is_final);

            try {
                console.log("Buying key...")
                let receipt = await this._session.call('xbr.marketmaker.buy_key', [delegate_adr, buyer_pubkey, key_id,
                    this._channel_oid, channel_seq, util.pack_uint256(amount), util.pack_uint256(balance), signature]);
                // ok, we've got the key!
                const remaining = new BN(receipt.remaining);
                console.log(' SimpleBuyer.unwrap() - XBR BUY    key 0x' + key_id.toString('hex') + ' bought for ' + amount.div(eip712.decimals) + ' XBR [payment_channel=' + this._channel_adr + ', remaining=' + remaining.div(eip712.decimals) + ' XBR]');

                let sealedKey = receipt['sealed_key'];
                try {
                    this._keys[key_id] = nacl.sealedbox.open(sealedKey, this._receive_key.publicKey, this._receive_key.secretKey);
                    try {
                        const payload = decrypt_payload(ciphertext, this._keys[key_id]);
                        d.resolve(payload);
                    } catch (e) {
                        d.reject(e);
                    }
                } catch (e) {
                    d.reject(e)
                }
            } catch (error) {
                // failed to purchase the key
                if (error.error === 'xbr.error.insufficient_payment_balance') {
                    const channel_adr = this._channel_adr;
                    const close_seq = this._seq;
                    const close_balance = this._balance;
                    const close_is_final = true;
                    const signature = eip712.sign_eip712_data(this._pkey_raw, channel_adr, close_seq, close_balance,
                        close_is_final);

                    console.log("auto-closing payment channel:", channel_adr, close_seq, close_balance, close_is_final);

                    await this._session.call('xbr.marketmaker.close_channel', [this._channel_adr_raw,
                        close_seq, util.pack_uint256(close_balance), close_is_final, signature]);
                }
                d.reject(error);
            }
        } else {
            let waitForPurchase = () => {
                if (!this._keys[key_id]) {
                    setTimeout(waitForPurchase, 200)
                } else {
                    try {
                        const payload = decrypt_payload(ciphertext, this._keys[key_id]);
                        d.resolve(payload);
                    } catch (e) {
                        d.reject(e);
                    }
                }
            };
            waitForPurchase()
        }
        return autobahn.util.promise(d);
    }

    ErrorMaxPriceExceeded (key_id, price, max_price) {
        this.message = "failed to buy key " + key_id.toString('hex') + ": price of " + price.toString() + " exceeds configured buyer maximum price " + max_price.toString();
        this.error = "xbr.error.max_price_exceeded";
    }


    ErrorInsufficientBalance (key_id, channel_adr, remaining, required) {
        this.message = "failed to buy key " + key_id.toString('hex') + ": remaining balance " + remaining.toString() + " in payment channel " + channel_adr + " insufficient - required minimum of " + required.toString();
        this.error = "xbr.error.insufficient_balance";
    }
}

exports.SimpleBuyer = SimpleBuyer;
