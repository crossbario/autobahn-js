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

var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");
var key_series = require('./keyseries');
var nacl = require('tweetnacl');
var util = require('./util.js');


var Seller = function (sellerKey) {
    self = this;
    this.sellerKey = sellerKey;
    this.keys = {};
    this.keysMap = {};
    this._providerID = eth_util.bufferToHex(eth_util.privateToPublic(sellerKey));
    this._session = null;
    this.sessionRegs = [];
    this._deferred_factory = util.deferred_factory();

    var account = new eth_accounts().privateKeyToAccount(sellerKey);
    this._addr = eth_util.toBuffer(account.address);
    this._privateKey = eth_util.toBuffer(account.privateKey);
};

Seller.prototype.start = function (session) {
    self._session = session;

    var d = this._deferred_factory();
    var procedure = 'xbr.provider.' + self._providerID + '.sell';
    session.register(procedure, self.sell).then(
        function (registration) {
            self.sessionRegs.push(registration);
            for (var key in self.keys) {
                self.keys[key].start();
            }
            d.resolve();
        },
        function (error) {
            console.log("Registration failed:", error);
            d.reject();
        }
    );
    return util.promise(d);
};

Seller.prototype.sell = function (args) {
    // proc_buy
    // eth_adr_raw
    // buyer_pubkey
    // key_id
    // paying_channel_adr
    // seq_after
    // amount_paid
    // balance_after
    // marketmaker_signature
    const key_id = Uint8Array.from(args[0]);
    const buyer_pubkey = Uint8Array.from(args[1]);

    if (!self.keysMap.hasOwnProperty(key_id)) {
        throw "no key with ID " + key_id;
    }
    seller_receipt = {
        signature: null,
        sealed_key: self.keysMap[key_id].encryptKey(key_id, buyer_pubkey)
    }
    return seller_receipt
};

Seller.prototype.add = function (apiID, prefix, price, interval) {
    var keySeries = new key_series.KeySeries(apiID, prefix, price, interval, _onRotate);
    this.keys[apiID] = keySeries;
    return keySeries;
};

var _onRotate = function (series) {
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
        {price: price, provider_id: provider_id}
    ).then(
        function (result) {
            console.log("Offer placed for key", result['key']);
        },
        function (error) {
            console.log("Call failed:", error);
        }
    )
};

Seller.prototype.stop = function () {
    for (var key in this.keys) {
        this.keys[key].stop()
    }

    for (var i = 0; i < this.sessionRegs.length; i++) {
        this.sessionRegs[i].unregister()
    }
};

Seller.prototype.wrap = function (api_id, uri, payload) {
    return this.keys[api_id].encrypt(payload)
};

exports.SimpleSeller = Seller;
