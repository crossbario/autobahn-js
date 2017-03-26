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

exports.testRawSocketTransport = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_rawsocket_transport.txt");
   var N = 2;

   test.log("connecting " + N + " sessions ...");

   var connection_config = {
      realm: testutil.config.realm,
      transports: [
         {
            type: 'rawsocket',
            host: '127.0.0.1',
            port: 8080
         }
      ],
      // FIXME - serializer is ignored! sth wrong
      serializers: [
         new autobahn.serializer.MsgpackSerializer()
      ],
      protocols: ['wamp.2.msgpack']
   };

   var dl = testutil.connect_n(N, connection_config);

   autobahn.when.all(dl).then(
      function (res) {
         test.log("all " + res.length + " sessions connected");

         for (var i = 0; i < res.length; ++i) {
            test.log("session._socket.info", res[i]._socket.info);
         }

         var session1 = res[0];
         var session2 = res[1];

         var counter = 0;

         var t1 = setInterval(function () {
            test.log("publishing to topic 'com.myapp.topic1': " + counter);
            session1.publish('com.myapp.topic1', [counter]);
            counter += 1;
         }, 100);

         var received = 0;

         var sub;
         function onevent1(args) {
            test.log("Got event:", args[0]);
            received += 1;
            if (received > 5) {
               test.log("Closing ..");

               clearInterval(t1);

               session1.leave();
               session2.leave();

               var chk = test.check()
               testcase.ok(!chk, chk);
               testcase.done();
            }
         }

         sub = session2.subscribe('com.myapp.topic1', onevent1);
      },
      function (err) {
         test.log(err);

         var chk = test.check();
         testcase.ok(!chk, chk);
         testcase.done();
      }
   );
}
