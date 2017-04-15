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

/*

From https://github.com/crossbario/crossbar/issues/1038:

I used a simple NodeJS/Autobahn 0.12 client for testing:

* Client A: Publish messages to com.myapp.topic1
* Client B: Subscribe to com..topic1 with wildcard matching
* Client C: Subscribe to com.myapp with prefix matching
* Client D: Subscribe to com with prefix matching
* Client E: Subscribe to com.myapp.topic1 with exact matching

*/

exports.testPubsubMultipleMatchingSubs = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_pubsub_multiple_matching_subs.txt");

   var dl = testutil.connect_n(5);

   function publish_later (session, delay, topic, args, kwargs, options) {

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
         test.log("all sessions connected");

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

         var received = 0;

         function on_event (args, kwargs, details, sub) {
            test.log('event: args=', args, ', kwargs=', kwargs);
            test.log('subscription: sub_topic=', sub.topic, ', sub_match=', sub.options.match, ', session_ident=', sub.session._ident);
            received += 1;
            if (received >= 9) {
               test.log("closing ..");

               session_e.leave();
               session_d.leave();
               session_c.leave();
               session_b.leave();
               session_a.leave();

               var chk = test.check()
               testcase.ok(!chk, chk);
               testcase.done();
            } else {
               console.log('received ' + received + ' events up to this point ..');
            }
         }

         var dl2 = [];

         dl2.push(session_b.subscribe('com..topic1', on_event, {match: 'wildcard'}));
         dl2.push(session_c.subscribe('com.myapp', on_event, {match: 'prefix'}));
         dl2.push(session_d.subscribe('com', on_event, {match: 'prefix'}));
         dl2.push(session_e.subscribe('com.myapp.topic1', on_event, {match: 'exact'}));

         autobahn.when.all(dl2).then(
            function (subs) {
               console.log('all test sessions subscribed!');
               for (var i = 0; i < subs.length; ++i) {
                  console.log('session_ident=' + subs[i].session._ident + ' subscribed with topic=' + subs[i].topic + ', match=' + subs[i].options.match);
               }

               console.log('publishing test events ..');

               var options = {acknowledge: true};

               var msg = 'hello subscriber!';
               var counter = 1;
               var dl3 = [];

               // these are received in sessions b-e
               dl3.push(publish_later(session_a, 100, 'com.myapp.topic1', [msg, counter++], null, options));

               // these are received in sessions c and d
               dl3.push(publish_later(session_a, 200, 'com.myapp.topic123', [msg, counter++], null, options));

               // these are received in sessions c and d
               dl3.push(publish_later(session_a, 300, 'com.myapp.topic1.foobar', [msg, counter++], null, options));

               // these are received in no session at all
               dl3.push(publish_later(session_a, 400, 'de.myapp.topic1', [msg, counter++], null, options));

               // these are received in session d only
               dl3.push(publish_later(session_a, 500, 'com.foobar', [msg, counter++], null, options));

               autobahn.when.all(dl3).then(
                  function (res) {
                     console.log('all test events published!');
                  },
                  function (err) {
                     console.log(err);
                  }
               );
            },
            function (err) {
               console.log(err);
            }
         );
      },
      function (err) {
         test.log(err);
      }
   );
}
