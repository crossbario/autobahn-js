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


exports.testRpcComplex = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_rpc_complex.txt");

   var connection = new autobahn.Connection(testutil.config);

   connection.onopen = function (session) {

      test.log('Connected');

      function add_complex(args, kwargs) {
         test.log("add_complex()", args, kwargs);
         return new autobahn.Result([], {c: args[0] + args[2], ci: args[1] + args[3]});
      }

      function split_name(args) {
         test.log("split_name()", args);
         return new autobahn.Result(args[0].split(" "));
      }

      function echo_complex(args, kwargs) {
         test.log("echo_complex()", args, kwargs);
         return new autobahn.Result(args, kwargs);
      }

      var endpoints = {
         'com.myapp.add_complex': add_complex,
         'com.myapp.split_name': split_name,
         'com.myapp.echo_complex': echo_complex
      };

      var pl1 = [];

      for (var uri in endpoints) {
         pl1.push(session.register(uri, endpoints[uri]));
      }

      autobahn.when.all(pl1).then(
         function () {
            test.log("All registered.");

            // we enforce sequential execution of RPCs to get "stable" test results

            var d = session.call('com.myapp.add_complex', [2, 3, 4, 5]).then(
               function (res) {
                  test.log("Result: " + res.kwargs.c + " + " + res.kwargs.ci + "i");
               }
            );

            d = d.then(function () {
               return session.call('com.myapp.split_name', ['Homer Simpson']).then(
                  function (res) {
                     test.log("Forename: " + res.args[0] + ", Surname: " + res.args[1]);
                  }
               );
            });

            var params = [
               [null, null],
               [null, {a: 23, b: "hello"}],
               [[1, 2, 3], null],
               [[], {}],
               [[], {a: 23, b: "hello"}],
               [[1, 2, 3], {}],
               [[1, 2, 3], {a: 23, b: "hello"}],
               [[1, 2, 3, {a: 23, b: "hello"}], {a: 23, b: "hello", c: [1, 2, 3]}],
            ];

            for (var i = 0; i < params.length; ++i) {
               (function (i, args, kwargs) {
                  d = d.then(function () {
                     return session.call('com.myapp.echo_complex', args, kwargs).then(
                        function (res) {
                           test.log("Complex echo", res);
                        }
                     );
                  });
               })(i, params[i][0], params[i][1]);
            }

            d.then(function () {
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
