# AutobahnJS - Change Log

## 20.2.2

* new: update XBR contract ABI files to v20.2.2
* fix: assert issue when running under different nodejs vm contexts (#490)

## 20.2.1

* new: update XBR contract ABI files to v20.2.1

## 20.1.1

* fix: upstream truffle dependency renaming - must use `@truffle/contract`
* new: update XBR contract ABI files

## v19.12.1

* fix: docker image build scripts
* new: streamline websocket selection (#479)

## v19.10.1

released 2019/10/02:

* new: XBR data service encryption and transaction support

## v17.5.2

* new: WAMP-cryptosign authentication support

## v0.9.1
 * compatibility with latest WAMP v2 spec ("RC-2, 2014/02/22")

## v0.9.0
 * complete new implementation with WAMP v2 only support

## v0.8.2
 * compatibility with Web workers
 * fix problem with Require.js
 * fix RPC error callback
 * update bundled to [whenjs](https://github.com/cujojs/when) v2.7.1

## v0.8.1
 * update bundled to [whenjs](https://github.com/cujojs/when) v2.7.0
 * fix IE8/9 connection timeout handling (relevant when running WebSocket Flash polyfill)

## v0.8.0
 * support for AMD/CommonJS module loading
 * update bundled to [whenjs](https://github.com/cujojs/when) v2.5.1
 * build with [Taschenmesser](https://pypi.python.org/pypi/taschenmesser)

## v0.7.9
 * simple `launch` function (also handles WAMP-CRA auth)
 * improve WAMP session logging
 * JSlint cosmetics

## v0.7.8
Not released.

## v0.7.7
 * build system improvements (gzipped version etc)
 * `getServerUrl` helper
 * `Session.log` and `Session.wsuri`
 * allow silencing of logging
 * update bundled [whenjs](https://github.com/cujojs/when)
 * started on NPM module (unfinished)
 * `console.log` polyfill

## v0.7.6
 * default 'onhangup' handler now logs all arguments (issue #19)

## v0.7.5
 * add option to skip announcing of WebSocket subprotocol (WAMP)
 * implement `deriveKey` function for salted WAMP-CRA

## v0.7.4
 * update bundled [whenjs](https://github.com/cujojs/when) to v1.8.1
 * update bundled [CryptoJS](http://code.google.com/p/crypto-js/) to v3.1.2
 * faster ID generation for tracking RPCs
