// Make code portable to Node.js without any changes
try {
   var autobahn = require('autobahn');
} catch (e) {
   // when running in browser, AutobahnJS will
   // be included without a module system
}

// Set up WAMP connection to router
var connection = new autobahn.Connection({
   url: 'ws://localhost:8080/ws',
   realm: 'tutorialpubsub'}
);

// Set up 'onopen' handler
connection.onopen = function (session) {

   // Start publishing events
   var counter = 0;

   setInterval ( function () {

      session.publish ('com.myapp.topic1', [ counter ], {}, { acknowledge: true}).then(

         function(publication) {
            console.log("published to topic 'com.myapp.topic1', publication ID is ", publication);
         },

         function(error) {
            console.log("publication error", error);
         }

      );

      counter += 1;

   }, 1000 );

};

// Open connection
connection.open();
