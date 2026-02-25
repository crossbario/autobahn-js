/**
 * Vitest setup file for AutobahnJS tests.
 *
 * Sets process.cwd() to packages/autobahn/ so that testutil.Testlog
 * baseline file paths (e.g. "test/test_basic_sync.txt") resolve
 * correctly. This matches the working directory nodeunit used.
 */

var path = require('path');

// Change CWD to packages/autobahn/ (where nodeunit ran from)
process.chdir(path.resolve(__dirname, '..'));
