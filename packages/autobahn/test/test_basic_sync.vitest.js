// Migrated from nodeunit to Vitest as part of #601.

var testutil = require('./testutil.js');

describe('basic sync', function () {
   test('sync logging', function () {
      var tlog = new testutil.Testlog('test/test_basic_sync.txt');
      tlog.log(true);
      var chk = tlog.check();
      expect(chk).toBeNull();
   });
});
