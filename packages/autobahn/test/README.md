# Tests for AutobahnJS functionality

Tests run using NodeJS and the Vitest test framework.

## Unit tests (no router required)

Run unit tests that don't require a WAMP router:

```console
just test-unit
```

## Full test suite (requires Crossbar.io)

First, ensure that a Crossbar.io instance is running with the default configuration (use `crossbar init` if needed). This will run a WAMP-over-WebSocket transport at `ws://localhost:8080/ws`.

> You should be able to use any compliant WAMP router (on `ws://localhost:8080/ws`) - your mileage may vary though.

Then run:

```console
just test
```

## First run

* You need to have NodeJS 22+ installed.
* Run `npm install` in the root directory

Here is a successful unit test run:

```console
$ just test-unit
==> Running unit tests with Vitest (no Crossbar.io required)...

 ✓ packages/autobahn/test/test_util_is_object.vitest.js (6 tests) 13ms
 ✓ packages/autobahn/test/test_rawsocket_protocol.vitest.js (4 tests) 15ms
 ✓ packages/autobahn/test/test_basic_sync.vitest.js (2 tests) 14ms
 ✓ packages/autobahn/test/test_basic_async.vitest.js (2 tests) 16ms
 ✓ packages/autobahn/test/test_sealedbox.vitest.js (1 test) 11ms

 Test Files  5 passed (5)
 Tests  15 passed (15)
```
