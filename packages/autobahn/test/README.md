# Tests for AutobahnJS functionality

Tests run using NodeJS and the nodeunit package.

First, ensure that a Crossbar.io instance is running with the default configuration (use `crossbar init` if needed). This will run a WAMP-over-WebSocket transport at `ws://localhost:8080/ws`.

> You should be able to use any compliant WAMP router (on `ws://localhost:8080/ws`) - your mileage may vary though. 

Then, open a terminal and run `npm test` in the `package` directory.

## First run

* You need to have NodeJS installed.
* Run `npm install` in the `package directory`

If all assertions fail, this may be because of different line ending formats for the created test_*.txt files.
In this case you need to remove the files and create a known good set of files on your system!

Here is a successful testrun:

```console
oberstet@thinkpad-t430s:~/scm/autobahn/AutobahnJS/package$ npm test

> autobahn@0.9.7 test /home/oberstet/scm/autobahn/AutobahnJS/package
> nodeunit test/test.js


test.js
✔ testConnect
✔ testRpcArguments
✔ testRpcComplex
✔ testRpcError
✔ testRpcOptions
✔ testRpcProgress
✔ testRpcSlowsquare
✔ testRpcRouting
✔ testRpcCallerDiscloseMe
✔ testPubsubBasic
✔ testPubsubComplex
✔ testPubsubOptions
✔ testPubsubExcludeMe
✔ testPubsubExclude
✔ testPubsubPrefixSub
✔ testPubsubWildcardSub
✔ testPubsubPublisherDiscloseMe

OK: 25 assertions (9444ms)
```
