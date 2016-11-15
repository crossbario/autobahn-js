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


exports.testPubsubOptions = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_pubsub_options.txt");

   var dl = testutil.connect_n(2);

   autobahn.when.all(dl).then(
      function (res) {
         test.log("all sessions connected");

         var session1 = res[0];
         var session2 = res[1];

         var counter = 0;

         var t1 = setInterval(function () {
            var options = {acknowledge: true};

            session1.publish('com.myapp.topic1', [counter], {}, options).then(
               function (pub) {
                  test.log("event published", typeof(pub), typeof(pub.id));
               }
            );
            counter += 1;
         }, 100);

         var received = 0;

         var sub;

         function onevent1(args, kwargs, details) {
            // FIXME: publisher disclosure now is a strictly router configured
            // test.log("got event:", typeof(details), typeof(details.publication), typeof(details.publisher), details.publisher == session1.id, args[0]);
            test.log("got event:", typeof(details), typeof(details.publication), args[0]);

            received += 1;
            if (received > 5) {
               test.log("Closing ..");

               clearInterval(t1);

               session1.leave();
               session2.leave();

               var chk = test.check()
               testcase.ok(!chk, chk);
               testcase.done();
            }
         }

         sub = session2.subscribe('com.myapp.topic1', onevent1);
      },
      function (err) {
         test.log(err);
      }
   );
}
