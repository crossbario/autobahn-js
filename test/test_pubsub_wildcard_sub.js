///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (C) 2011-2015 Tavendo GmbH, http://tavendo.com
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var autobahn = require('./../index.js');
var testutil = require('./testutil.js');


exports.testPubsubWildcardSub = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_pubsub_wildcard_sub.txt");

   var dl = testutil.connect_n(2);

   autobahn.when.all(dl).then(
      function (res) {
         test.log("all sessions connected");

         var session1 = res[0];
         var session2 = res[1];
         var received = 0;

         function onevent1 (args) {
            test.log("Got event:", args);
            received += 1;
            if (received >= 2) {
               test.log("Closing ..");

               session1.leave();
               session2.leave();

               var chk = test.check()
               testcase.ok(!chk, chk);
               testcase.done();
            }
         }

         var options = {match: 'wildcard'};
         var msg = "Hello wildcard pattern subscriber!";
         var counter = 0;

         session2.subscribe('com.example..create', onevent1, options).then(
            function (subscription) {
               // these are all received
               session1.publish('com.example.foobar.create', [msg, counter++]);
               session1.publish('com.example.1.create', [msg, counter++]);

               // these are not received
               session1.publish('com.example.foobar.delete', [msg, counter++]);
               session1.publish('com.example.foobar.create2', [msg, counter++]);
               session1.publish('com.example.foobar.create.barbaz', [msg, counter++]);
               session1.publish('com.example.foobar', [msg, counter++]);
               session1.publish('com.example.create', [msg, counter++]);
               session1.publish('com.example', [msg, counter++]);
            },
            function (err) {
               test.log(err);
            }
         );
      },
      function (err) {
         test.log(err);
      }
   );
}
