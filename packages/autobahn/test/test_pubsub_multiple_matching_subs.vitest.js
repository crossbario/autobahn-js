// Migrated from nodeunit to Vitest as part of #601.

var autobahn = require('../index.js');
var testutil = require('./testutil.js');
var adapter = require('./vitest_adapter.js');

describe('pubsub multiple matching subs', function () {
   test('wildcard, prefix and exact matching subscriptions', function () {
      return adapter.run(function (testcase) {
         testcase.expect(1);

         var test = new testutil.Testlog('test/test_pubsub_multiple_matching_subs.txt', true);

         var dl = testutil.connect_n(5);

         function publish_later(session, delay, topic, args, kwargs, options) {
            // create a deferred
            var d = autobahn.when.defer();

            // resolve the promise after 1s
            setTimeout(function () {
               options.acknowledge = true;
               session.publish(topic, args, kwargs, options).then(
                  function (res) {
                     d.resolve(res);
                  },
                  function (err) {
                     d.reject(err);
                  }
               );
            }, delay);

            // need to return the promise
            return d.promise;
         }

         autobahn.when.all(dl).then(
            function (res) {
               test.log('all sessions connected');

               var session_a = res[0];
               var session_b = res[1];
               var session_c = res[2];
               var session_d = res[3];
               var session_e = res[4];

               session_a._ident = 'A';
               session_b._ident = 'B';
               session_c._ident = 'C';
               session_d._ident = 'D';
               session_e._ident = 'E';

               // The router delivers one publication to several sessions, each on its
               // own connection, and the order they receive it in varies from run to
               // run (#601, #617). So record every delivery, finish when all nine are
               // in and every publish is acknowledged, and log them sorted by
               // publication, then session: who received what is still checked exactly.
               var EXPECTED = 9;
               var deliveries = [];
               var all_published = false;
               var finished = false;

               function finish() {
                  if (finished || !all_published || deliveries.length < EXPECTED) {
                     return;
                  }
                  finished = true;

                  deliveries.sort(function (x, y) {
                     return (
                        x.counter - y.counter ||
                        (x.ident < y.ident ? -1 : x.ident > y.ident ? 1 : 0)
                     );
                  });
                  for (var i = 0; i < deliveries.length; ++i) {
                     var d = deliveries[i];
                     test.log('event: args=', d.args, ', kwargs=', d.kwargs);
                     test.log(
                        'subscription: sub_topic=',
                        d.topic,
                        ', sub_match=',
                        d.match,
                        ', session_ident=',
                        d.ident
                     );
                  }
                  test.log('closing ..');

                  session_e.leave();
                  session_d.leave();
                  session_c.leave();
                  session_b.leave();
                  session_a.leave();

                  var chk = test.check();
                  testcase.ok(!chk, chk);
                  testcase.done();
               }

               function on_event(args, kwargs, details, sub) {
                  deliveries.push({
                     counter: args[1],
                     ident: sub.session._ident,
                     args: args,
                     kwargs: kwargs,
                     topic: sub.topic,
                     match: sub.options.match,
                  });
                  finish();
               }

               var dl2 = [];

               dl2.push(session_b.subscribe('com..topic1', on_event, { match: 'wildcard' }));
               dl2.push(session_c.subscribe('com.myapp', on_event, { match: 'prefix' }));
               dl2.push(session_d.subscribe('com', on_event, { match: 'prefix' }));
               dl2.push(session_e.subscribe('com.myapp.topic1', on_event, { match: 'exact' }));

               autobahn.when.all(dl2).then(
                  function (subs) {
                     test.log('all test sessions subscribed!');
                     for (var i = 0; i < subs.length; ++i) {
                        test.log(
                           'session_ident=' +
                              subs[i].session._ident +
                              ' subscribed with topic=' +
                              subs[i].topic +
                              ', match=' +
                              subs[i].options.match
                        );
                     }

                     test.log('publishing test events ..');

                     var options = { acknowledge: true };

                     var msg = 'hello subscriber!';
                     var counter = 1;
                     var dl3 = [];

                     // these are received in sessions b-e
                     dl3.push(
                        publish_later(
                           session_a,
                           500,
                           'com.myapp.topic1',
                           [msg, counter++],
                           null,
                           options
                        )
                     );

                     // these are received in sessions c and d
                     dl3.push(
                        publish_later(
                           session_a,
                           1000,
                           'com.myapp.topic123',
                           [msg, counter++],
                           null,
                           options
                        )
                     );

                     // these are received in sessions c and d
                     dl3.push(
                        publish_later(
                           session_a,
                           1500,
                           'com.myapp.topic1.foobar',
                           [msg, counter++],
                           null,
                           options
                        )
                     );

                     // these are received in no session at all
                     dl3.push(
                        publish_later(
                           session_a,
                           2000,
                           'de.myapp.topic1',
                           [msg, counter++],
                           null,
                           options
                        )
                     );

                     // these are received in session d only
                     dl3.push(
                        publish_later(
                           session_a,
                           2500,
                           'com.foobar',
                           [msg, counter++],
                           null,
                           options
                        )
                     );

                     autobahn.when.all(dl3).then(
                        function (res) {
                           test.log('all test events published!');
                           all_published = true;
                           finish();
                        },
                        function (err) {
                           test.log(err);
                        }
                     );
                  },
                  function (err) {
                     test.log(err);
                  }
               );
            },
            function (err) {
               test.log(err);
            }
         );
      });
   });
});
