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

var autobahn = require('../index.js');
var testutil = require('./testutil.js');

// var randomBytes = require('randombytes');
var seed = require('random-bytes-seed');

/*
AutobahnJS supports use of native binary values in application payload args/kwargs
of WAMP calls or events. Use the following JavaScript types:

* browsers: Uint8Array (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
* node: Buffer (https://nodejs.org/api/buffer.html)
*/

function run_test (test, ser) {

   var randomBytes = seed('a seed');

   var done = autobahn.when.defer();

   var config = {
      //url: testutil.config.url,
      url: "ws://127.0.0.1:8090",
      realm: testutil.config.realm,
      serializers: [ser]
   };
   var connection = new autobahn.Connection(config);

   connection.onopen = function (session) {

      test.log('Connected: ' + session._socket.info.protocol);

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
                {a: 5, b: "hello2", c: [1, 2, 3]},
                [-9007199254740991, 9007199254740991],
                null,
                // UTC of today
                BigInt('1558266424841951553'),
                // 2**255-1 : NotImplementedError TODO: TAG BIGNUM for bigger bignum bytes_info=24, len(ull)=8
                // BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819967'),
                BigInt('340282366920938463463374607431768211455'),
                Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7]),
                randomBytes(32),
                {a: 5, b: "hello2", c: randomBytes(32)}
            ];

            for (var i = 0; i < vals1.length; ++i) {

               pl2.push(session.call('com.myapp.echo', [vals1[i]]).then(
                  function (res) {
                      if (Buffer.isBuffer(res)) {
                        test.log("Result [com.myapp.echo]: " + res.toString('hex'));
                      } else if (res && res.constructor == Object) {
                          test.log("Result [com.myapp.echo]:");
                          for (var key in res) {
                            if (res[key] && Buffer.isBuffer(res[key])) {
                                test.log("  " + key + ", " + res[key].toString('hex'));
                            } else {
                                test.log("  " + key + ", " + res[key]);
                            }
                          }
                      } else {
                        test.log("Result [com.myapp.echo]: " + res);
                      }
                  },
                  function (err) {
                     test.log("Error [com.myapp.echo]:", err.error, err.args, err.kwargs);
                  }
               ));
            }

            autobahn.when.all(pl2).then(function () {
               var pl3 = [];

               for (var i = 0; i < vals1.length; ++i) {

                    pl3.push(session.call('any.echo', [vals1[i]]).then(
                    function (res) {
                        if (Buffer.isBuffer(res)) {
                            test.log("Result [any.echo]: " + res.toString('hex'));
                        } else if (res && res.constructor == Object) {
                            test.log("Result [any.echo]:");
                            for (var key in res) {
                                if (res[key] && Buffer.isBuffer(res[key])) {
                                    test.log("  " + key + ", " + res[key].toString('hex'));
                                } else {
                                    test.log("  " + key + ", " + res[key]);
                                }
                            }
                        } else {
                            test.log("Result [any.echo]: " + res);
                        }
                    },
                    function (err) {
                        test.log("Error [any.echo]:", err.error, err.args, err.kwargs);
                    }
                    ));
                }

                autobahn.when.all(pl3).then(function () {
                    test.log("All finished.");
                    connection.close();
                    done.resolve();
                });
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
