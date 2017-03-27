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

var autobahn = require('./../index.js');
var testutil = require('./testutil.js');

exports.testAsync = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_basic_async.txt");

   var d1 = autobahn.when.defer();
   var d2 = autobahn.when.defer();

   var df = autobahn.when.all([d1.promise, d2.promise]).then(
      function (res) {
         test.log(res);
         var chk = test.check();
         testcase.ok(!chk, chk);
         testcase.done();
      },
      function (err) {
         test.log(err);
         testcase.done();
      }
   );

   d1.resolve(23);
   d2.resolve(42);
}
