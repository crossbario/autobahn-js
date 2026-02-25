// Migrated from nodeunit to Vitest as part of #601.

var autobahn = require('../index.js');
var testutil = require('./testutil.js');
var adapter = require('./vitest_adapter.js');

describe('basic async', function () {
   test('deferred promise resolution', function () {
      return adapter.run(function (testcase) {
         var tlog = new testutil.Testlog('test/test_basic_async.txt');

         var d1 = autobahn.when.defer();
         var d2 = autobahn.when.defer();

         autobahn.when.all([d1.promise, d2.promise]).then(
            function (res) {
               tlog.log(res);
               var chk = tlog.check();
               testcase.ok(!chk, chk);
               testcase.done();
            },
            function (err) {
               tlog.log(err);
               testcase.done();
            }
         );

         d1.resolve(23);
         d2.resolve(42);
      });
   });
});
