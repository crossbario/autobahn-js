// Vitest configuration for AutobahnJS
// https://vitest.dev/config/

import { defineConfig } from 'vitest/config';

export default defineConfig({
   test: {
      // Run tests from the autobahn package directory so that testutil.js
      // Testlog baseline file paths (e.g. "test/test_basic_sync.txt")
      // resolve correctly relative to packages/autobahn/
      root: 'packages/autobahn',

      // Setup file: changes CWD to packages/autobahn/ for Testlog paths
      setupFiles: ['test/vitest.setup.js'],

      // Test file pattern: *.vitest.js files coexist with nodeunit *.js tests
      // during the migration period
      include: ['test/**/*.vitest.js'],

      // Inject describe, test, expect as globals (CommonJS compatibility)
      globals: true,

      // Timeout for async tests (integration tests connect to Crossbar.io)
      testTimeout: 30000,

      // Run tests sequentially - integration tests share a single
      // Crossbar.io router and can interfere with each other
      pool: 'forks',
      poolOptions: {
         forks: {
            singleFork: true,
         },
      },
   },
});
