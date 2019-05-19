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

// var randomBytes = require('randombytes');
var seed = require('random-bytes-seed')
var randomBytes = seed('a seed')


function run_test (test, ser) {

   var done = autobahn.when.defer();

   var config = {
      //url: testutil.config.url,
      url: "ws://127.0.0.1:8090",
      realm: testutil.config.realm,
      serializers: [ser]
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

            var vals1 = [
                1.7,
                "hello",
                [1, 2, -3],
                {a: 5, b: "hello2"},
                [-9007199254740991, 9007199254740991],
                null,
                Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7]),
                randomBytes(32)
            ];

            for (var i = 0; i < vals1.length; ++i) {

               pl2.push(session.call('com.myapp.echo', [vals1[i]]).then(
                  function (res) {
                      if (Buffer.isBuffer(res)) {
                        test.log("Result [com.myapp.echo]:", res.toString('hex'));
                      } else {
                        test.log("Result [com.myapp.echo]:", res);
                      }                     
                  },
                  function (err) {
                     test.log("Error [com.myapp.echo]:", err.error, err.args, err.kwargs);
                  }
               ));
            }

            for (var i = 0; i < vals1.length; ++i) {

                pl2.push(session.call('any.echo', [vals1[i]]).then(
                   function (res) {
                      if (Buffer.isBuffer(res)) {
                        test.log("Result [any.echo]:", res.toString('hex'));
                      } else {
                        test.log("Result [any.echo]:", res);
                      }
                   },
                   function (err) {
                      test.log("Error [any.echo]:", err.error, err.args, err.kwargs);
                   }
                ));
             }

             autobahn.when.all(pl2).then(function () {
               test.log("All finished.");
               connection.close();
               done.resolve();
            });
         },
         function () {
            test.log("Registration failed!", arguments);
         }
      );
   };

   connection.open();

   return done.promise;
};


exports.testBinaryCBOR = function (testcase) {

    testcase.expect(1);
    var test = new testutil.Testlog("test/test_binary_cbor.txt");

    var dl = [];
 
    dl.push(run_test(test, new autobahn.serializer.CBORSerializer()));

    autobahn.when.all(dl).then(function () {
        var chk = test.check();
        testcase.ok(!chk, chk);
        testcase.done();    
    });
};

exports.testBinaryMsgPack = function (testcase) {

    testcase.expect(1);
    var test = new testutil.Testlog("test/test_binary_msgpack.txt");

    var dl = [];
 
    dl.push(run_test(test, new autobahn.serializer.MsgpackSerializer()));

    autobahn.when.all(dl).then(function () {
        var chk = test.check();
        testcase.ok(!chk, chk);
        testcase.done();    
    });
};

exports.testBinaryJSON = function (testcase) {

    testcase.expect(1);
    var test = new testutil.Testlog("test/test_binary_json.txt");

    var dl = [];
 
    dl.push(run_test(testcase, test, new autobahn.serializer.JSONSerializer()));

    autobahn.when.all(dl).then(function () {
        var chk = test.check();
        testcase.ok(!chk, chk);
        testcase.done();    
    });
};
