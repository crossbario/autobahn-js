// Migrated from nodeunit to Vitest as part of #601.

var autobahn = require('../index.js');
var testutil = require('./testutil.js');
var adapter = require('./vitest_adapter.js');

describe('connect', function () {
   test('connect N sessions', function () {
      return adapter.run(function (testcase) {
         testcase.expect(1);

         var test = new testutil.Testlog('test/test_connect.txt', true);
         var N = 10;

         test.log('connecting ' + N + ' sessions ...');

         var dl = testutil.connect_n(N);

         autobahn.when.all(dl).then(
            function (res) {
               test.log('all ' + res.length + ' sessions connected');

               for (var i = 0; i < res.length; ++i) {
                  test.log('leaving session ' + i);
                  res[i].leave();
               }

               var chk = test.check();
               testcase.ok(!chk, chk);
               testcase.done();
            },
            function (err) {
               test.log(err);
               testcase.done();
            }
         );
      });
   });
});
