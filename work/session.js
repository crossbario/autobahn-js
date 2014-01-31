var socketeer = require('./socketeer.js');
var global = this;

var Session = function (url, onopen, onclose, options) {

   var self = this;

   self._url = url;
   self._socket = socketeer.websocket(global, self._url, ['wamp.2.json']);

   self._socket.onmessage = function (evt) {
      console.log(evt.data);
      this.close();
   }

   self._socket.onopen = function () {
      console.log("connected!");
      this.send("Hello, world.")
   }

   self._socket.onclose = function (evt) {
      console.log(evt.reason);
   }
}

Session.prototype.call = function () {
}


exports.Session = Session;