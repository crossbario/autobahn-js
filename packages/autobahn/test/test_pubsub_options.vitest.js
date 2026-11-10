// Migrated from nodeunit to Vitest as part of #601.

var autobahn = require('../index.js');
var testutil = require('./testutil.js');
var adapter = require('./vitest_adapter.js');

describe('pubsub options', function () {
   test('publish with acknowledge option', function () {
      return adapter.run(function (testcase) {
         testcase.expect(1);

         var test = new testutil.Testlog('test/test_pubsub_options.txt');

         var dl = testutil.connect_n(2);

         autobahn.when.all(dl).then(
            function (res) {
               test.log('all sessions connected');

               var session1 = res[0];
               var session2 = res[1];

               var counter = 0;
               var sub;

               // The log must not depend on whether an acknowledgement or its event
               // arrives first: that order varies (it differed on Node 25, #601). So
               // record both, finish when all of them are in, and log each kind in
               // its own order. Events from one publisher to one subscriber keep
               // their order (WAMP guarantees it), so their sequence is still checked.
               var N = 6;
               var acks = [];
               var events = [];
               var finished = false;

               function finish() {
                  if (finished || acks.length < N || events.length < N) {
                     return;
                  }
                  finished = true;
                  clearInterval(t1);

                  for (var i = 0; i < acks.length; ++i) {
                     test.log.apply(test, acks[i]);
                  }
                  for (var j = 0; j < events.length; ++j) {
                     test.log.apply(test, events[j]);
                  }
                  test.log('Closing ..');

                  session1.leave();
                  session2.leave();

                  var chk = test.check();
                  testcase.ok(!chk, chk);
                  testcase.done();
               }

               function onevent1(args, kwargs, details) {
                  // FIXME: publisher disclosure now is a strictly router configured
                  // test.log("got event:", typeof(details), typeof(details.publication), typeof(details.publisher), details.publisher == session1.id, args[0]);
                  if (events.length < N) {
                     events.push([
                        'got event:',
                        typeof details,
                        typeof details.publication,
                        args[0],
                     ]);
                  }
                  finish();
               }

               sub = session2.subscribe('com.myapp.topic1', onevent1);

               var t1 = setInterval(function () {
                  var options = { acknowledge: true };

                  session1.publish('com.myapp.topic1', [counter], {}, options).then(function (pub) {
                     if (acks.length < N) {
                        acks.push(['event published', typeof pub, typeof pub.id]);
                     }
                     finish();
                  });
                  counter += 1;
               }, 1000);
            },
            function (err) {
               test.log(err);
            }
         );
      });
   });
});
