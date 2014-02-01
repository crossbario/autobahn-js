var autobahn = require('./autobahn.js');

var session = new autobahn.Session();

session.onopen = function () {
   // WAMP session established

   function utcnow() {
      console.log("Someone is calling me;)");
      now = new Date();
      return now.toISOString();
   }

   if (false) {
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

   if (true) {
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

session.onclose = function () {
   // WAMP session closed
};

var transport = autobahn.WebSocket(false, 'ws://127.0.0.1:9000/', ['wamp.2.json']);
session.connect(transport);



/*
function main (session) {

   session.call('com.myapp.time').then(...)
}

var transport = autobahn.FallbackTransport({appname: 'com.myapp.ultimate'});

transport.add(new autobahn.WebSocket(false, 'ws://127.0.0.1:9000/', ['wamp.2.json']), {retries: 5});
transport.add(new autobahn.LongPoll(), {retries: 3});
transport.add(new autobahn.Alert());

transport.onopen = function (session) {
   main(session);
};

transport.onretry = function (retry) {
   next();
};

transport.onclose = function (why) {

};

transport.open({username: 'joe'});

transport.next();

transport.close();
*/