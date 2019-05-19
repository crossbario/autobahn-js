var cbor = require('cbor');
var nacl = require('tweetnacl');
var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");


var SimpleBuyer = function (buyerKey, maxPrice) {
    this._running = false;
    this._session = null;
    this._channel = null;
    this._balance = null;
    this._keys = {};
    this._maxPrice = maxPrice;

    var account = new eth_accounts.Accounts().privateKeyToAccount(buyerKey);
    this._addr = eth_util.toBuffer(account.address);

    this._keyPair = nacl.box.keyPair();
};

SimpleBuyer.prototype.start = function(session, consumerID, on_success, on_failure) {
    self = this;
    self._session = session;
    self._running = true;

    session.call('xbr.marketmaker.get_payment_channel', [self._addr]).then(
        function (paymentChannel) {
            self._channel = paymentChannel;
            self._balance = paymentChannel['remaining'];
            if (on_success !== undefined) {
                on_success(self._balance);
            }
        },
        function (error) {
            console.log("Call failed:", error);
        }
    );
};

SimpleBuyer.prototype.stop = function () {
    this._running = false;
};

SimpleBuyer.prototype.balance = function (on_success, on_failure) {
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
            on_failure(error['error']);
        }
    );
};

SimpleBuyer.prototype.openChannel = function (buyerAddr, amount, on_success, on_failure) {
    var signature = nacl.randomBytes(64);
    this._session.call(
        'xbr.marketmaker.open_payment_channel',
        [this._addr, this._addr, amount, signature]
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
            on_failure(error['error']);
        }
    );
};

SimpleBuyer.prototype.closeChannel = function () {
};

SimpleBuyer.prototype.unwrap = function (keyID, encSer, ciphertext, on_success, on_failure) {
    self = this;
    if (!self._keys.hasOwnProperty(keyID)) {
        self._keys[keyID] = false;
        self._session.call(
            'xbr.marketmaker.buy_key',
            self._addr,
            self._keyPair.publicKey,
            keyID,
            self._maxPrice,
            nacl.randomBytes(64)
        ).then(
            function (receipt) {
                var sealedKey = receipt['sealed_key'];
                try {
                    self._keys[keyID] = nacl.sealedbox.open(sealedKey, self._keyPair.publicKey,
                        self._keyPair.secretKey);
                    var message = nacl.secretbox.open(ciphertext, new Uint8Array(8), self._keys[keyID]);
                    var payload = cbor.decode(message);
                    on_success(payload);
                } catch (e) {
                    on_failure(e)
                }
            },
            function (error) {
                on_failure(error['error'])
            }
        );
    }
};

exports.SimpleBuyer = SimpleBuyer;
