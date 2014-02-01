var autobahn = require('./autobahn.js');

var session = new autobahn.Session();

session.onopen = function () {
   // WAMP session established

   this.call('com.timeservice.now').then(
      function (now) {
         console.log("Current time: ", now);
      }
   );
};

session.onclose = function () {
   // WAMP session closed
};

var transport = autobahn.WebSocket(true, 'ws://127.0.0.1:9000/');

session.connect(transport);
