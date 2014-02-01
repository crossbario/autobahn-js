var socketeer = require('./socketeer.js');
var socket = socketeer.create(this, 'ws://127.0.0.1:9000/');

socket.onmessage = function (evt) {
   console.log(evt.data);
   socket.close();
}

socket.onopen = function () {
   console.log("connected!");
   socket.send("Hello, world.")
}

socket.onclose = function (evt) {
   console.log(evt.reason);
}