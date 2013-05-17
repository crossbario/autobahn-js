function Test(msg) {
  var self = this;
  this._msg = msg;
}

Test.prototype.hello = function (name) {
   console.log(name);
   console.log(this._msg);
}

module.exports = Test;
