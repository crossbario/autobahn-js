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
    const key_id = Uint8Array.from(args[0]);
    const buyer_pubkey = Uint8Array.from(args[1]);
    if (!self.keysMap.hasOwnProperty(key_id)) {
        throw "no key with ID " + key_id;
    }
    return self.keysMap[key_id].encryptKey(key_id, buyer_pubkey)
};

Seller.prototype.add = function (apiID, prefix, price, interval) {
    var keySeries = new key_series.KeySeries(apiID, prefix, price, interval, _onRotate);
    this.keys[apiID] = keySeries;
    return keySeries;
};

var _onRotate = function (series) {
    self.keysMap[series.keyID] = series;

    // FIXME
    var delegate_signature = nacl.randomBytes(65);

    self._session.call(
        'xbr.marketmaker.place_offer',
        [series.keyID, series.apiID, series.prefix, BigInt(Date.now() * 1000000 - 10 * 10 ** 9),
            self._addr, delegate_signature],
        {price: series.price, provider_id: self._providerID}
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
