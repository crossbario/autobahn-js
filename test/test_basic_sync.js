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

exports.testSync = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_basic_sync.txt");

   test.log(true);
   var chk = test.check();
   testcase.ok(!chk, chk);
   testcase.done();
}
