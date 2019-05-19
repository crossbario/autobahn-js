var autobahn = require("../autobahn.js");
var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");
var key_series = require('./keyseries');


var Seller = function (sellerKey) {
    this.sellerKey = sellerKey;
    this.keys = {};
    this.keysMap = {};
    this._providerID = eth_util.bufferToHex(eth_util.privateToPublic(sellerKey));
    this._session = null;
    this.sessionRegs = [];

    var account = new eth_accounts.Accounts().privateKeyToAccount(sellerKey);
    this._addr = eth_util.toBuffer(account.address);
    this._privateKey = eth_util.toBuffer(account.privateKey);
};

Seller.prototype.start = function (session) {
    self = this;
    self._session = session;

    var procedure = 'xbr.protocol.' + self._providerID + '.sell';
    session.register(procedure, self.sell).then(
        function (registration) {
            self.sessionRegs.push(registration);
            for (var key in self.keys) {
                self.keys[key].start();
            }
        },
        function (error) {
            console.log("Registration failed:", error);
        }
    );
};

Seller.prototype.sell = function (key_id, buyer_pubkey) {
    if (!this.keysMap.hasOwnProperty(key_id)) {
        throw "no key with ID " + key_id;
    }
    var encrypted = autobahn.nacl.sealedbox.seal();
    return this.keysMap.keyID.encrypt(key_id, buyer_pubkey)
};

Seller.prototype.add = function (apiID, prefix, price, interval) {
    var keySeries = new key_series.KeySeries(apiID, prefix, price, interval, this._onRotate);
    this.keys[apiID] = keySeries;
    return keySeries;
};

Seller.prototype._onRotate = function (series) {
    self.keysMap[series.keyID] = series;

    self._session.call(
        'xbr.marketmaker.place_offer',
        [series.keyID, series.apiID, series.prefix, BigInt(Date.now() * 1000000 - 10 * 10 ** 9),
            self._addr, autobahn.nacl.randomBytes(64)],
        {price: series.price, provider_id: self._providerID}
    ).then(
        function (result) {
            // console.log("Offer placed", result);
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