var autobahn = require('./autobahn.js');

var session = new autobahn.Session();

session.onopen = function () {
   // WAMP session established

   this.call('com.timeservice.now').then(
      function (now) {
         console.log("Current time: ", now);
         process.exit();
      }
   );
};

session.onclose = function () {
   // WAMP session closed
};

var transport = autobahn.WebSocket(false, 'ws://127.0.0.1:9000/', ['wamp.2.json']);

session.connect(transport);
