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


exports.testComplex = function (testcase) {

   var test = new testutil.Testlog("test/test_rpc_complex.txt");


   var connection = new autobahn.Connection({
      url: 'ws://127.0.0.1:8080/ws',
      realm: 'realm1'}
   );


   connection.onopen = function (session) {

      function add_complex(args, kwargs) {
         test.log("Someone is calling me;)");
         return new autobahn.Result([], {c: args[0] + args[2], ci: args[1] + args[3]});
      }

      function split_name(args) {
         return new autobahn.Result(args[0].split(" "));
      }

      var endpoints = {
         'com.myapp.add_complex': add_complex,
         'com.myapp.split_name': split_name
      };

      var pl1 = [];

      for (var uri in endpoints) {
         pl1.push(session.register(uri, endpoints[uri]));
      }

      autobahn.when.all(pl1).then(
         function () {
            test.log("All registered.");

            var pl2 = [];

            pl2.push(session.call('com.myapp.add_complex', [2, 3, 4, 5]).then(
               function (res) {
                  test.log("Result: " + res.kwargs.c + " + " + res.kwargs.ci + "i");
               }
            ));

            pl2.push(session.call('com.myapp.split_name', ['Homer Simpson']).then(
               function (res) {
                  test.log("Forename: " + res.args[0] + ", Surname: " + res.args[1]);
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

