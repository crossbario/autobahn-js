/**
 * Nodeunit-to-Vitest adapter for AutobahnJS test migration (#601).
 *
 * Provides a nodeunit-compatible `testcase` object backed by Vitest
 * assertions, enabling mechanical migration of existing tests.
 *
 * Usage in *.vitest.js files:
 *
 *   var adapter = require('./vitest_adapter.js');
 *
 *   test('my test', function () {
 *      return adapter.run(function (testcase) {
 *         // ... original nodeunit test body unchanged ...
 *         testcase.ok(true, 'should be true');
 *         testcase.done();
 *      });
 *   });
 */

/**
 * Run a nodeunit-style test function within a Vitest test.
 * Returns a Promise that resolves when testcase.done() is called.
 *
 * @param {Function} fn - nodeunit test function: function(testcase) { ... }
 * @returns {Promise}
 */
exports.run = function (fn) {
   return new Promise(function (resolve, reject) {
      var testcase = {
         // testcase.expect(N) - no-op in Vitest (assertion counting not needed)
         expect: function () {},

         // testcase.ok(expr, msg) - truthy assertion
         ok: function (expr, msg) {
            expect(expr).toBeTruthy();
         },

         // testcase.equal(actual, expected, msg) - strict equality
         equal: function (actual, expected, msg) {
            expect(actual).toBe(expected);
         },

         // testcase.deepEqual(actual, expected, msg) - deep equality
         deepEqual: function (actual, expected, msg) {
            expect(actual).toEqual(expected);
         },

         // testcase.doesNotThrow(fn, msg) - assert no throw
         doesNotThrow: function (fn, msg) {
            expect(fn).not.toThrow();
         },

         // testcase.done() - signal test completion
         done: function () {
            resolve();
         },
      };

      try {
         fn(testcase);
      } catch (err) {
         reject(err);
      }
   });
};
