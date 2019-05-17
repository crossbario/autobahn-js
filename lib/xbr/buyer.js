var autobahn = require("../autobahn.js");
var eth_accounts = require("web3-eth-accounts");


var Buyer = function (buyerKey, maxPrice) {
    this._running = false;
    this._session = null;

    var accounts = new eth_accounts.Accounts();
    var account = accounts.privateKeyToAccount(buyerKey);
    this._addr = new Buffer(account.address);

    this._keyPair = autobahn.nacl.box.keyPair();
};

Buyer.prototype.start = function(session, consumerID) {
    this._session = session;
    this._running = true;

    session.call('xbr.marketmaker.get_payment_channel', this._addr).then(

    );
};

Buyer.prototype.stop = function () {
    this._running = false;
};

Buyer.prototype.balance = function () {
    this._session.call('xbr.marketmaker.get_payment_channel', this._addr).then(

    );
};

Buyer.prototype.openChannel = function (buyerAddr, amount) {
    var signature = autobahn.nacl.randomBytes(64);
    this._session.call(
        'xbr.marketmaker.open_payment_channel',
        [buyerAddr, this._addr, amount, signature]
    ).then(

    );
};

Buyer.prototype.closeChannel = function () {

};

Buyer.prototype.unwrap = function (keyID, encSer, ciphertext) {

};
