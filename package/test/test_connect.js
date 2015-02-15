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


exports.testConnect = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_connect.txt");
   var N = 10;

   test.log("connecting " + N + " sessions ...");

   var dl = testutil.connect_n(N);

   autobahn.when.all(dl).then(
      function (res) {
         test.log("all " + res.length + " sessions connected");

         for (var i = 0; i < res.length; ++i) {
            test.log("leaving session " + i);
            res[i].leave();
         }

         var chk = test.check()
         testcase.ok(!chk, chk);
         testcase.done();
      },
      function (err) {
         test.log(err);
      }
   );
}
