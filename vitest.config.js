// Vitest configuration for AutobahnJS
// https://vitest.dev/config/

import { defineConfig } from 'vitest/config';

export default defineConfig({
   test: {
      // Run tests from the autobahn package directory so that testutil.js
      // Testlog baseline file paths (e.g. "test/test_util_is_object_success.txt")
      // resolve correctly relative to packages/autobahn/
      root: 'packages/autobahn',

      // Test file pattern: *.vitest.js files coexist with nodeunit *.js tests
      // during the migration period
      include: ['test/**/*.vitest.js'],

      // Inject describe, test, expect as globals (CommonJS compatibility)
      globals: true,

      // Timeout for async tests (rawsocket protocol tests use timers)
      testTimeout: 10000,
   },
});
