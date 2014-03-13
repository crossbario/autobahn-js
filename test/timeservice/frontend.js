try {
   var autobahn = require('autobahn');
} catch (e) {
   // when running in browser, AutobahnJS will
   // be included without a module system
}

var connection1 = new autobahn.Connection({
   url: 'ws://127.0.0.1:8080/ws',
   realm: 'realm1'}
);

var session1 = null;

connection1.onopen = function (new_session) {

   session1 = new_session;
   session1.log("Session open.");

   session1.call('com.timeservice.now').then(
      function (now) {
         session1.log(now);
         //connection.close();
      },
      function (error) {
         console.log("Call failed:", error);
         //connection.close();
      }
   );
};

connection1.onclose = function (reason, details) {
   console.log("connection 1", reason, details);
}

connection1.open();



/*
var connection2 = new autobahn.Connection({
   url: 'ws://127.0.0.1:8080/ws',
   realm: 'realm1'}
);

var session2 = null;

connection2.onopen = function (new_session) {

   session2 = new_session;

   session2.call('com.timeservice.now').then(
      function (now) {
         console.log("S2 Current time:", now);
         //connection.close();
      },
      function (error) {
         console.log("Call failed:", error);
         //connection.close();
      }
   );
};

connection2.onclose = function (details) {
   console.log("connection 2", details);
}

connection2.open();
*/