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


exports.testMsgpackSerialization = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_msgpack_serialization.txt");

   var serializer = new autobahn.serializer.MsgpackSerializer();

   var config = {
      url: testutil.config.url,
      realm: testutil.config.realm,
      serializers: [serializer]
   };
   var connection = new autobahn.Connection(config);

   connection.onopen = function (session) {

      test.log('Connected');

      function echo(args) {
         return args[0];
      }

      var endpoints = {
         'com.myapp.echo': echo
      };

      var pl1 = [];

      for (var uri in endpoints) {
         pl1.push(session.register(uri, endpoints[uri]));
      }

      autobahn.when.all(pl1).then(
         function () {
            test.log("All registered.");
            test.log("Serializer ID: " + session._socket.serializer.SERIALIZER_ID);

            var pl2 = [];

            var vals1 = [1.7, "hello", [1, 2, -3], {a: 5, b: "hello2"}, [-9007199254740991, 9007199254740991], null];

            for (var i = 0; i < vals1.length; ++i) {

               pl2.push(session.call('com.myapp.echo', [vals1[i]]).then(
                  function (res) {
                     test.log("Result:", res);
                  },
                  function (err) {
                     test.log("Error:", err.error, err.args, err.kwargs);
                  }
               ));
            }

            autobahn.when.all(pl2).then(function () {
               test.log("All finished.");
               connection.close();

               var chk = test.check();
               testcase.ok(!chk, chk);
               testcase.done();
            });
         },
         function () {
            test.log("Registration failed!", arguments);
         }
      );
   };

   connection.open();
};
