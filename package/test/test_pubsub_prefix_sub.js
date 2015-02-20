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


exports.testPubsubPrefixSub = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_pubsub_prefix_sub.txt");

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
            if (received >= 7) {
               test.log("Closing ..");

               session1.leave();
               session2.leave();

               var chk = test.check()
               testcase.ok(!chk, chk);
               testcase.done();
            }
         }

         var options = {match: 'prefix'};
         var msg = "Hello prefix pattern subscriber!";
         var counter = 0;

         session2.subscribe('com.myapp', onevent1, options).then(
            function (subscription) {
               // these are all received
               session1.publish('com.myapp.topic1.foobar', [msg, counter++]);
               session1.publish('com.myapp.topic1', [msg, counter++]);
               session1.publish('com.myapp.topi', [msg, counter++]);
               session1.publish('com.myapp2.foobar', [msg, counter++]);
               session1.publish('com.myapp2', [msg, counter++]);
               session1.publish('com.myapp.2', [msg, counter++]);
               session1.publish('com.myapp', [msg, counter++]);

               // these are not received
               session1.publish('com.app.topic1', [msg, counter++]);
               session1.publish('com.myap', [msg, counter++]);
               session1.publish('com', [msg, counter++]);
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
