var autobahn = require('./autobahn.js');

var session = new autobahn.Session();

session.onconnect = function () {
   this.join("realm1");
};

session.onjoin = function () {
   // WAMP session established

   function utcnow() {
      console.log("Someone is calling me;)");
      now = new Date();
      return now.toISOString();
   }

   if (true) {
      this.register(utcnow, 'com.timeservice.now').then(
         function (registration) {
            console.log("Registered!", registration.id);
         },
         function (error) {
            console.log("Registration failed!", error);
         }
      );
   }

   function onevent(i) {
      console.log("Got event:", i);
   }

   if (false) {
      this.subscribe(onevent, 'com.myapp.topic1').then(
         function (subscription) {
            console.log("Subscribed!", subscription.id);
         },
         function (error) {
            console.log("Subscription failed!", error);
         }
      );
   }

   if (false) {
      this.call('com.timeservice.now').then(
         function (now) {
            console.log("Current time: ", now);
            process.exit();
         },
         function (error) {
            console.log("RPC Error:", error);
            process.exit();
         }
      );
   }
};

session.onleave = function () {
   console.log("WAMP session closed");
   this.disconnect();
};

session.ondisconnect = function () {
   console.log("transport closed");
};

var transport = autobahn.WebSocket('ws://127.0.0.1:9000/', ['wamp.2.json']);
session.connect(transport);
