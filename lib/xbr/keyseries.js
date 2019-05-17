var cbor = require('cbor');
var nacl = require('tweetnacl');
var sealedbox = require('tweetnacl-sealedbox-js');

var KeySeries = function(apiID, price, interval, prefix, onRotate) {
    this.apiID = apiID;
    this.price = price;
    this.interval = interval;
    this.prefix = prefix;
    this.onRotate = onRotate;
    this._archive = {};
    this._started = false;
};

KeySeries.prototype.encrypt = function(payload) {
    return nacl.secretbox(cbor.encode(payload), nacl.randomBytes(nacl.secretbox.nonceLength),
        this._archive[this.keyID]);
};

KeySeries.prototype.encryptKey = function(keyID, buyerPubKey) {
    return sealedbox.seal(this._archive[this.keyID], buyerPubKey)
};

KeySeries.prototype.start = function() {
    if (!this._started) {
        this._rotate(this);
        this._started = true;
    }
};

KeySeries.prototype._rotate = function(context) {
    context.keyID = nacl.randomBytes(16);
    context._archive[context.keyID] = nacl.randomBytes(nacl.secretbox.keyLength);
    context.onRotate(context);
    // Rotate the keys
    // FIXME: make this to wait for the above onRotate callback to finish
    setTimeout(context._rotate, context.interval, context);
};

KeySeries.prototype.stop = function() {
    if (this._started) {
        this._started = false;
    }
};

exports.KeySeries = KeySeries;
