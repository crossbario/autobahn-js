///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (C) 2011-2014 Tavendo GmbH, http://tavendo.com
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var autobahn = require('./../index.js');
var testutil = require('./testutil.js');


exports.testRpcSlowsquare = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_rpc_slowsquare.txt");

   var connection = new autobahn.Connection(testutil.config);

   connection.onopen = function (session) {

      test.log('Connected');

      // a "fast" function or a function that returns
      // a direct value (not a promise)
      function square(x) {
         return x * x;
      }

      // simulates a "slow" function or a function that
      // returns a promise
      function slowsquare(x) {

         // create a deferred
         var d = autobahn.when.defer();

         // resolve the promise after 1s
         setTimeout(function () {
            d.resolve(x * x);
         }, 500);

         // need to return the promise
         return d.promise;
      }

      var endpoints = {
         'com.math.square': square,
         'com.math.slowsquare': slowsquare
      };

      var pl1 = [];

      for (var uri in endpoints) {
         pl1.push(session.register(uri, endpoints[uri]));
      }

      autobahn.when.all(pl1).then(
         function () {
            test.log("All registered.");

            var pl2 = [];

            var t1 = process.hrtime();
            pl2.push(session.call('com.math.slowsquare', [3]).then(
               function (res) {
                  var duration = process.hrtime(t1);
                  test.log("Slow Square:", res);
               },
               function (err) {
                  test.log("Error", err);
               }
            ));

            var t2 = process.hrtime();
            pl2.push(session.call('com.math.square', [3]).then(
               function (res) {
                  var duration = process.hrtime(t2);
                  test.log("Quick Square:", res);
               },
               function (err) {
                  test.log("Error", err);
               }
            ));

            autobahn.when.all(pl2).then(function () {
               test.log("All finished.");
               connection.close();

               var chk = test.check()
               testcase.ok(!chk, chk);
               testcase.done();
            });
         },
         function () {
            test.log("Registration failed!", arguments);
         }
      );  
   };

   connection.open();
}
