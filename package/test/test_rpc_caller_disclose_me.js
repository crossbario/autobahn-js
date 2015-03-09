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


exports.testRpcCallerDiscloseMe = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_rpc_caller_disclose_me.txt");

   var dl = testutil.connect_n(2);

   autobahn.when.all(dl).then(
      function (res) {
         test.log("all sessions connected");

         var session1 = res[0];
         var session2 = res[1];

         var counter = 0;

         // cleans up after test
         function onTestFinished() {
               session1.leave();
               session2.leave();

               var chk = test.check()
               testcase.ok(!chk, chk);
               testcase.done();
         }

         

         // Case 1: "session.caller_disclose_me" unset
         // 
         // Expected:
         //    - no caller ID given for call without "disclose_me" set
         //    - no caller ID given for call without "disclose_me" set to "false"
         //    - caller ID given for call without "disclose_me" set to "true"
         function case1 () {
         
            test.log("");
            test.log("Case 1: 'session.caller_disclose_me' unset");
            test.log("=============================================");

            var counter = 0;

            function procedure1 (args, kwargs, details) {
               
               var caller_disclosed = details.caller === undefined ? false : true;
               test.log("Caller disclosed:", caller_disclosed);

               counter += 1;
               if (counter === 3) {
                  test.log("");
                  test.log("");
                  
                  case2();
                  
               }
            }

            session1.register("com.myapp.procedure1", procedure1);

            session2.call("com.myapp.procedure1"); // false
            session2.call("com.myapp.procedure1", [], {}, { disclose_me: false}); // false
            session2.call("com.myapp.procedure1", [], {}, { disclose_me: true}); // true

         }

         // Case 2: "session.caller_disclose_me" set to "false"
         // 
         // Expected:
         //    - no caller ID given for call without "disclose_me" set
         //    - no caller ID given for call without "disclose_me" set to "false"
         //    - caller ID given for call without "disclose_me" set to "true"
         function case2 () {
         
            test.log("");
            test.log("Case 2: 'session.caller_disclose_me' set to 'false'");
            test.log("======================================================");

            var counter = 0;

            function procedure2 (args, kwargs, details) {
               
               var caller_disclosed = details.caller === undefined ? false : true;
               test.log("Caller disclosed:", caller_disclosed);

               counter += 1;
               if (counter === 3) {
                  test.log("");
                  test.log("");
                  
                  case3();
                  
               }
            }

            session1.register("com.myapp.procedure2", procedure2);

            session2.caller_disclose_me = false;

            session2.call("com.myapp.procedure2"); // false
            session2.call("com.myapp.procedure2", [], {}, { disclose_me: false}); // false
            session2.call("com.myapp.procedure2", [], {}, { disclose_me: true}); // true

         }

         // Case 3: "session.caller_disclose_me" set to "true"
         // 
         // Expected:
         //    - caller ID given for call without "disclose_me" set
         //    - no caller ID given for call without "disclose_me" set to "false"
         //    - caller ID given for call without "disclose_me" set to "true"
         function case3 () {
         
            test.log("");
            test.log("Case 3: 'session.caller_disclose_me' set to 'true'");
            test.log("=====================================================");

            var counter = 0;

            function procedure3 (args, kwargs, details) {
               
               var caller_disclosed = details.caller === undefined ? false : true;
               test.log("Caller disclosed:", caller_disclosed);

               counter += 1;
               if (counter === 3) {
                  test.log("");
                  test.log("");
                  
                  onTestFinished();
                  
               }
            }

            session1.register("com.myapp.procedure3", procedure3);

            session2.caller_disclose_me = true;

            session2.call("com.myapp.procedure3"); // true
            session2.call("com.myapp.procedure3", [], {}, { disclose_me: false}); // false
            session2.call("com.myapp.procedure3", [], {}, { disclose_me: true}); // true

         }

         case1();      

      },
      function (err) {
         test.log(err);
      }
   );
}
