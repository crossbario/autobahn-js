var autobahn = require('./../index.js');  
var cryptojs = require('crypto-js');
console.log(cryptojs);

var connection = new autobahn.Connection({
   url: 'ws://127.0.0.1:9000/',
   realm: 'realm1'}
);

connection.onopen = function (session) {

   session.call('com.timeservice.now').then(
      function (now) {
         console.log("Current time: " + now);
         //session.leave();
         connection.close();
      }
   );
};

connection.open();
