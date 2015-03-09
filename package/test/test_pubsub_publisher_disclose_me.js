///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (C) Tavendo GmbH, http://tavendo.com
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var autobahn = require('./../index.js');
var testutil = require('./testutil.js');


exports.testPubsubPublisherDiscloseMe = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_pubsub_publisher_disclose_me.txt");

   var dl = testutil.connect_n(2);

   autobahn.when.all(dl).then(
      function (res) {
         test.log("all sessions connected");

         var session1 = res[0];
         var session2 = res[1];

         var counter = 0;
         function onevent1(args, kwargs, details) {
            var publisher_disclosed = details.publisher === undefined ? false : true;
            test.log("Publisher disclosed:", publisher_disclosed);

            counter += 1;
            if (counter = 9) {
               test.log("Closing ..");

               session1.leave();
               session2.leave();

               var chk = test.check()
               testcase.ok(!chk, chk);
               testcase.done();
            }
         }

         session1.subscribe("com.myapp.topic1", onevent1);

         // No explicit setting of 'publisher_disclose_me'
         session2.publish("com.myapp.topic1"); // false
         session2.publish("com.myapp.topic1", [], {}, { disclose_me: false}); // false
         session2.publish("com.myapp.topic1", [], {}, { disclose_me: true}); // true

         // Explicit setting to 'false',
         // should be same outcome as above
         session2.publisher_disclose_me = false;

         session2.publish("com.myapp.topic1"); // false
         session2.publish("com.myapp.topic1", [], {}, { disclose_me: false}); // false
         session2.publish("com.myapp.topic1", [], {}, { disclose_me: true}); // true

         // Explicit setting to 'true'
         session2.publisher_disclose_me = true;

         session2.publish("com.myapp.topic1"); // true 
         session2.publish("com.myapp.topic1", [], {}, { disclose_me: false}); // false
         session2.publish("com.myapp.topic1", [], {}, { disclose_me: true}); // true         

      },
      function (err) {
         test.log(err);
      }
   );
}
