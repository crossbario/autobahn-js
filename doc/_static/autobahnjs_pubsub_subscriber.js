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

   var currentSubscription = null;

   // Define an event handler
   function onEvent(args, kwargs, details) {

      console.log("Event received ", args, kwargs, details);

      if ( args[0] > 20 ) {
         session.unsubscribe(subscription).then(

            function(gone) {
               console.log("unsubscribe successfull");
            },

            function(error) {
               console.log("unsubscribe failed", error);
            }

         );
      }

   }

   // Subscribe to a topic
   session.subscribe('com.myapp.topic1', onEvent).then(

      function(subscription) {
         console.log("subscription successfull", subscription);
         currentSubscription = subscription;
      },

      function(error) {
         console.log("subscription failed", error);
      }

   );
};

// Open connection
connection.open();
