///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (c) Crossbar.io Technologies GmbH and contributors
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var autobahn = require('../index.js');
var testutil = require('./testutil.js');

var REGISTER_MSG_TYPE = 64;
var CALL_MSG_TYPE = 48;

exports.testRpcRequestIdSequence = function (testcase) {

   testcase.expect(2);

   var test = new testutil.Testlog("test/test_rpc_request_id_sequence.txt");

   var connection = new autobahn.Connection(testutil.config);

   connection.onopen = function (session) {

      test.log('Connected');

      // Hijack invocation processing to collect request IDs of incoming calls.
      var sent_request_ids = [];
      var original_send_wamp = session._send_wamp;
      session._send_wamp = function(msg) {
         if ((msg[0] === CALL_MSG_TYPE) || ((msg[0] === REGISTER_MSG_TYPE))) {
            var requestId = msg[1];
            test.log('' + 'Sent call with id ' + requestId);
            sent_request_ids.push(requestId);
         }
         return original_send_wamp(msg)
      };

      function noop() { return null; }

      session.register('com.myapp.do_nothing', noop).then(
         function () {
            test.log("Procedure registered.");

            // Enforce sequential execution of RPCs to get "stable" test results
            var d = session.call('com.myapp.do_nothing');
            d = d.then(function (res) {
               test.log('Received response.');
               return session.call('com.myapp.do_nothing')
            });
            d = d.then(function (res) {
               test.log('Received response.');
               return session.call('com.myapp.do_nothing')
            });
            d = d.then(function (res) {
               test.log('Received response.');
            });

            d.then(function () {
               test.log("All calls made.");
               testcase.deepEqual(sent_request_ids, [1, 2, 3, 4]);

               session._send_wamp = original_send_wamp;
               connection.close();

               var chk = test.check();
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
};
