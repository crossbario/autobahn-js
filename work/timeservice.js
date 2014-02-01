var autobahn = require('./autobahn.js');

var session = new autobahn.Session();

session.onopen = function () {
   // WAMP session established

   function utcnow() {
      now = new Date();
      return now.toISOString();
   }

   this.register(utcnow, 'com.timeservice.now').then(
      function (registration) {
         console.log("Registered!", registration.id);
      }
   );

   function onevent(i) {
      console.log("Got event:", i);
   }

   this.subscribe(onevent, 'com.myapp.topic1').then(
      function (subscription) {
         console.log("Subscribed!", subscription.id);
      }
   );

   this.call('com.timeservice.now').then(
      function (now) {
         console.log("Current time: ", now);
         //process.exit();
      }
   );
};

session.onclose = function () {
   // WAMP session closed
};

var transport = autobahn.WebSocket(false, 'ws://127.0.0.1:9000/', ['wamp.2.json']);

session.connect(transport);
