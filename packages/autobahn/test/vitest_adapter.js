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
/**
 * The nodeunit message as Vitest's assertion message, so a failure says why: for a
 * Testlog comparison, the expected and actual logs, or the missing reference file
 * (#617). Without it, a failure read only "expected false to be truthy".
 */
function message(msg) {
   return msg === undefined || msg === null ? undefined : String(msg);
}

exports.run = function (fn) {
   return new Promise(function (resolve, reject) {
      var settled = false;

      function safeReject(err) {
         if (!settled) {
            settled = true;
            reject(err);
         }
      }

      var testcase = {
         // testcase.expect(N) - no-op in Vitest (assertion counting not needed)
         expect: function () {},

         // testcase.ok(expr, msg) - truthy assertion
         ok: function (expr, msg) {
            try {
               expect(expr, message(msg)).toBeTruthy();
            } catch (err) {
               safeReject(err);
            }
         },

         // testcase.equal(actual, expected, msg) - strict equality
         equal: function (actual, expected, msg) {
            try {
               expect(actual, message(msg)).toBe(expected);
            } catch (err) {
               safeReject(err);
            }
         },

         // testcase.deepEqual(actual, expected, msg) - deep equality
         deepEqual: function (actual, expected, msg) {
            try {
               expect(actual, message(msg)).toEqual(expected);
            } catch (err) {
               safeReject(err);
            }
         },

         // testcase.doesNotThrow(fn, msg) - assert no throw
         doesNotThrow: function (fn, msg) {
            try {
               expect(fn, message(msg)).not.toThrow();
            } catch (err) {
               safeReject(err);
            }
         },

         // testcase.done() - signal test completion
         done: function () {
            if (!settled) {
               settled = true;
               resolve();
            }
         },
      };

      try {
         fn(testcase);
      } catch (err) {
         safeReject(err);
      }
   });
};
