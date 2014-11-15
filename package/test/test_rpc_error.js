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


exports.testRpcError = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_rpc_error.txt");

   var connection = new autobahn.Connection(testutil.config);

   connection.onopen = function (session) {

      test.log('Connected');

      function sqrt(args) {
         var x = args[0];
         if (x === 0) {
            throw "don't ask folly questions;)";
         }
         var res = Math.sqrt(x);
         if (res !== res) {
            //throw "cannot take sqrt of negative";
            throw new autobahn.Error('com.myapp.error', ['fuck'], {a: 23, b: 9});
         }
         return res.toFixed(6);
      }

      var endpoints = {
         'com.myapp.sqrt': sqrt
      };

      var pl1 = [];

      for (var uri in endpoints) {
         pl1.push(session.register(uri, endpoints[uri]));
      }

      autobahn.when.all(pl1).then(
         function () {
            test.log("All registered.");

            var pl2 = [];

            var vals1 = [2, 0, -2];

            for (var i = 0; i < vals1.length; ++i) {

               pl2.push(session.call('com.myapp.sqrt', [vals1[i]]).then(
                  function (res) {
                     test.log("Result:", res);
                  },
                  function (err) {
                     test.log("Error:", err.error, err.args, err.kwargs);
                  }
               ));
            }

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
