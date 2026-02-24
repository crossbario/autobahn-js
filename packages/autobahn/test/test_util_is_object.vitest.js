/**
 * Unit test to make sure objects from vm instances also pass object checks.
 *
 * Migrated from nodeunit to Vitest as part of #601.
 */

// test, expect, describe are provided as globals by Vitest
var autobahn = require('../index.js');
var vm = require('vm');

describe('util.is_object', function () {
   // It should pass for objects
   test('succeeds for plain objects', function () {
      var obj = { foo: 'bar' };
      expect(autobahn.util.is_object(obj)).toBe(true);
   });

   // It should fail for scalars and arrays
   test('fails for scalars and arrays', function () {
      expect(autobahn.util.is_object(1)).toBe(false);
      expect(autobahn.util.is_object([])).toBe(false);
      expect(autobahn.util.is_object('string')).toBe(false);
   });

   // instanceof checks inside VMs should fail
   test('instanceof fails inside VM context', function () {
      var context = { kwargs: { foo: 'bar' }, isObj: false };
      vm.createContext(context);
      var code = "kwargs.baz = 'bax'; isObj = kwargs instanceof Object";
      vm.runInContext(code, context);
      expect(context.isObj).toBe(false);
   });

   // autobahn.util.is_object should pass inside VM context
   test('is_object succeeds inside VM context', function () {
      var context = {
         kwargs: { foo: 'bar' },
         util: autobahn.util,
         check1: null,
         check2: null,
      };
      vm.createContext(context);
      var code =
         "kwargs.baz = 'bax'; check1 = kwargs instanceof Object; check2 = util.is_object(kwargs);";
      vm.runInContext(code, context);
      // instanceof fails across VM contexts
      expect(context.check1).toBe(false);
      // autobahn.util.is_object works correctly across VM contexts
      expect(context.check2).toBe(true);
   });
});
