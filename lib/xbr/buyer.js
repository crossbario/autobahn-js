var nacl = require('tweetnacl');
var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");


var SimpleBuyer = function (buyerKey, maxPrice) {
    this._running = false;
    this._session = null;
    this._channel = null;
    this._balance = null;

    var account = new eth_accounts.Accounts().privateKeyToAccount(buyerKey);
    this._addr = eth_util.toBuffer(account.address);

    this._keyPair = nacl.box.keyPair();
};

SimpleBuyer.prototype.start = function(session, consumerID, on_success) {
    self = this;
    self._session = session;
    self._running = true;

    session.call('xbr.marketmaker.get_payment_channel', [self._addr]).then(
        function (paymentChannel) {
            self._channel = paymentChannel;
            self._balance = paymentChannel['remaining'];
            on_success(self._balance);
        },
        function (error) {
            console.log("Call failed:", error);
            self._balance = null;
        }
    );
};

SimpleBuyer.prototype.stop = function () {
    this._running = false;
};

SimpleBuyer.prototype.balance = function (on_success) {
    this._session.call('xbr.marketmaker.get_payment_channel', [self._addr]).then(
        function (paymentChannel) {
            var balance = {
                amount: paymentChannel['amount'],
                remaining: paymentChannel['remaining'],
                inflight: paymentChannel['inflight']
            };
            on_success(balance);
        },
        function (error) {
            console.log("Call failed:", error);
            self._balance = null;
        }
    );
};

SimpleBuyer.prototype.openChannel = function (buyerAddr, amount, on_success) {
    var signature = nacl.randomBytes(64);
    result = this._session.call(
        'xbr.marketmaker.open_payment_channel',
        [buyerAddr, this._addr, amount, signature]
    ).then(
        function (paymentChannel) {
            var balance = {
                amount: paymentChannel['amount'],
                remaining: paymentChannel['remaining'],
                inflight: paymentChannel['inflight']
            };
            on_success(balance);
        },
        function (error) {
            console.log("Call failed:", error);
            self._balance = null;
        }
    );
    return result;
};

SimpleBuyer.prototype.closeChannel = function () {

};

SimpleBuyer.prototype.unwrap = function (keyID, encSer, ciphertext) {

};

exports.SimpleBuyer = SimpleBuyer;
