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


exports.testCborSerialization = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_cbor_serialization.txt");

   var json_ser = new autobahn.serializer.JSONSerializer();
   var cbor_ser = new autobahn.serializer.CborSerializer();

   var config = {
      url: testutil.config.url,
      realm: testutil.config.realm,
      serializers: [cbor_ser]
   };
   var connection = new autobahn.Connection(config);

   connection.onopen = function (session) {

      test.log('Connected');

      session.leave();

      var chk = test.check();
      testcase.ok(!chk, chk);
      testcase.done();
   };

   connection.open();
};
