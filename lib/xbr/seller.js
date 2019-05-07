var autobahn = require("autobahn");
var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");

var start = function (session) {
    this._session = session;
    this._session_regs = [];
    var regs = this._session_regs;

    var procedure = 'xbr.protocol.' + this._provider_id + '.sell';
    session.register(procedure, sell).then(
        function (registration) {
            regs.append(registration);
            console.log("Procedure registered:", registration.id);
        },
        function (error) {
            console.log("Registration failed:", error);
        }
    );
};

var sell = function (key_id, buyer_pubkey) {
    if (this.keys_map.hasOwnProperty(key_id)) {
        throw "no key with ID " + key_id;
    }
    encrypted = autobahn.nacl.sealedbox.seal();
    return this.keys_map.key_id.encrypt(key_id, buyer_pubkey)
};

var add = function () {
    
};

var stop = function () {
    for (var i = 0; i < this._session_regs.length; i++) {
        this._session_regs[i].unregister()
    }
};

var wrap = function (api_id, uri, payload) {
    return this.keys[api_id].encrypt(payload)
};

var Seller = function (buyerKey) {
    this.buyerKey = buyerKey;
    this.start = start;
    this.sell = sell;
    this.stop = stop;
    this.add = add;
    this.wrap = wrap;

    var pubKey = eth_util.privateToPublic(buyerKey);

    this.keys = {};
    this.keys_map = {};
    this._provider_id = pubKey;
    this._session = null;
    this._session_regs = null;

    var accounts = new eth_accounts.Accounts();
    var account = accounts.privateKeyToAccount(buyerKey);
    var addr = new Buffer(account.address);
    var privateKey = new Buffer(account.privateKey);
};

exports.SimpleSeller = Seller;
