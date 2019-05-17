var autobahn = require("../autobahn.js");
var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");
var key_series = require('./keyseries');


var Seller = function (buyerKey) {
    this.buyerKey = buyerKey;

    var pubKey = eth_util.bufferToHex(eth_util.privateToPublic(buyerKey));
    console.log(pubKey);

    this.keys = {};
    this.keysMap = {};
    this._providerID = pubKey;
    this._session = null;
    this.sessionRegs = [];

    var accounts = new eth_accounts.Accounts();
    var account = accounts.privateKeyToAccount(buyerKey);
    var addr = new Buffer(account.address);
    var privateKey = new Buffer(account.privateKey);
};

Seller.prototype.start = function (session) {
    this._session = session;
    self = this;

    var procedure = 'xbr.protocol.' + this._providerID + '.sell';
    console.log(procedure);
    session.register(procedure, this.sell).then(
        function (registration) {
            self.sessionRegs.push(registration);
            console.log("Procedure registered:", registration.id);
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
    this.keysMap[series.keyID] = series;

    this._session.call('xbr.marketmaker.place_offer', series.keyID, series.apiID, series.prefix)
};

Seller.prototype.stop = function () {
    for (var i = 0; i < this.sessionRegs.length; i++) {
        this.sessionRegs[i].unregister()
    }
};

Seller.prototype.wrap = function (api_id, uri, payload) {
    return this.keys[api_id].encrypt(payload)
};

exports.SimpleSeller = Seller;
