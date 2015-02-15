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


exports.testPubsubComplex = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_pubsub_complex.txt");

   var dl = testutil.connect_n(2);

   autobahn.when.all(dl).then(
      function (res) {
         test.log("all sessions connected");

         var session1 = res[0];
         var session2 = res[1];

         var counter = 0;

         var t1 = setInterval(function () {
            var lst = [];
            for (var i = 0; i < counter; ++i) {
               lst.push(i);
            }
            var obj = {
               'counter': counter,
               'foo': [1, counter, 2 * counter],
               'bar': 'This is a test text.',
               'baz': {
                  'a': 1.23456, 'b': 10000, 'c': null, 'd': 'foo'
               }
            };
            session1.publish('com.myapp.topic1', lst, obj);

            counter += 1;

            test.log("events published", counter);
         }, 100);


         var received = 0;

         function on_topic1(args, kwargs) {
            test.log("got event:", args, kwargs);
            received += 1;
            if (received > 5) {
               test.log("closing ..");

               clearInterval(t1);

               session1.leave();
               session2.leave();

               var chk = test.check()
               testcase.ok(!chk, chk);
               testcase.done();
            }
         }

         session2.subscribe('com.myapp.topic1', on_topic1);
      },
      function (err) {
         test.log(err);
      }
   );
}
