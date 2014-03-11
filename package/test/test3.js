var autobahn = require('./../index.js');  
var cryptojs = require('crypto-js');

var connection = new autobahn.Connection({
   url: 'ws://127.0.0.1:8080/ws',
   realm: 'realm1'}
);

connection.onopen = function (session) {

   session.log("Session open.")

   session.call('com.timeservice.now').then(
      function (now) {
         session.log("Current time is " + now);
         //session.leave();
         connection.close();
      }
   );
};

connection.open();
