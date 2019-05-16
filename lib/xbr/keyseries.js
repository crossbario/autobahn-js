var cbor = require('cbor');
var nacl = require('tweetnacl');

var KeySeries = function(apiID, price, interval, prefix, onRotate) {
    this.apiID = apiID;
    this.price = price;
    this.interval = interval;
    this.prefix = prefix;
    this.onRotate = onRotate;
    this._archive = {};
    this.keyID = null;
    this._key = null;
};

KeySeries.prototype.encrypt = function(payload) {
    var data = cbor.encode(payload);
};

KeySeries.prototype.encryptKey = function(keyID, buyerPubKey) {

};

KeySeries.prototype.start = function() {
    setTimeout(this._rotate, this.interval);
};

KeySeries.prototype._rotate = function() {
    this.keyID = nacl.randomBytes(16);
    this._key = nacl.randomBytes(nacl.secretbox.keyLength);
    this._archive[this._id] =
    this._box = nacl.secretbox()
    this.onRotate(this);
};

KeySeries.prototype.stop = function() {

};

exports.KeySeries = KeySeries;
