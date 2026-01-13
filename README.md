# **Autobahn**|JS

WAMP for Browsers and NodeJS.

[![CI](https://github.com/crossbario/autobahn-js/actions/workflows/main.yml/badge.svg)](https://github.com/crossbario/autobahn-js/actions/workflows/main.yml)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue.svg)](https://crossbario.github.io/autobahn-js/)
[![npm version](https://img.shields.io/npm/v/autobahn.svg)](https://www.npmjs.com/package/autobahn)
[![npm downloads](https://img.shields.io/npm/dm/autobahn.svg)](https://www.npmjs.com/package/autobahn)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[![NPM](https://nodei.co/npm/autobahn.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/autobahn/)

**npm quicklinks:**

* [**autobahn**](https://www.npmjs.com/package/autobahn/) - Autobahn for NodeJS
* [**autobahn-browser**](https://www.npmjs.com/package/autobahn-browser/) - Autobahn for browsers
* [**autobahn-xbr**](https://www.npmjs.com/package/autobahn-xbr/) - Autobahn-[XBR](https://xbr.network/) for NodeJS
* [**autobahn-xbr-browser**](https://www.npmjs.com/package/autobahn-xbr-browser/) - Autobahn-[XBR](https://xbr.network/) for browsers

**XBR quicklinks:**

* [XBR Network](https://xbr.network/) - The XBR Network homepage.
* [XBR Protocol](https://github.com/crossbario/xbr-protocol) - The XBR Protocol source repository.
* [XBR Docs](https://xbr.network/docs/protocol/index.html) - XBR Protocol and APIs Documentation.

---

**Autobahn**|JS is a subproject of the [Autobahn project](https://autobahn.readthedocs.io) and provides an open-source implementation of the **[Web Application Messaging Protocol V2](http://wamp.ws/)** in JavaScript under the [MIT license](/LICENSE).

WAMP provides asynchronous **Remote Procedure Calls** and **Publish & Subscribe** for applications in *one* protocol running over [WebSocket](http://tools.ietf.org/html/rfc6455) (and fallback transports for old browsers).

**Autobahn**|JS runs on both **Web browsers** and **[Node.js](http://nodejs.org/)**.

## Platform Requirements

**Autobahn**|JS targets:

- **Node.js 22+** (uses native WebSocket, no external dependencies)
- **Modern browsers**: Chrome, Firefox, Edge, Safari (all current versions)

For older Node.js versions (< 22), use AutobahnJS v20.x which includes the `ws` library.

## What can I do with this stuff?

**Autobahn|JS** makes **distributed, realtime Web applications easy**: it provides the infrastructure for both **distributing live updates** to all connected clients (using the PubSub messaging pattern) and for **calling remote procedures** in different backend components (using RPC).

It is ideal for distributed, multi-client and server applications, such as multi-user database-drive business applications, real-time charts, sensor networks (IoT), instant messaging or MMOGs (massively multi-player online games).

The protocol that **Autobahn|JS** uses, WAMP, enables application architectures with application code **distributed freely across processes and devices** according to functional aspects. All WAMP clients are equal in that they can publish events and subscribe to them, can offer a procedure for remote calling and call remote procedures.

Since WAMP implementations exist for **multiple languages**, this extends beyond JavaScript clients: WAMP applications can be polyglot. Application components can be implemented in a language and run on a device which best fit the particular use case. Applications can span the range from embedded IoT sensors right to mobile clients or the browser - using the same protocol.

## Show me some code

The following example implements all four roles that **Autobahn**|JS offers

 * Publisher
 * Subscriber
 * Caller (calls a remote procedure)
 * Callee (offers a remote procedure)

**The code runs unaltered in the browser or Node.js!**

```javascript
try {
   // for Node.js
   var autobahn = require('autobahn');
} catch (e) {
   // for browsers (where AutobahnJS is available globally)
}

var connection = new autobahn.Connection({url: 'ws://127.0.0.1:9000/', realm: 'realm1'});

connection.onopen = function (session) {

   // 1) subscribe to a topic
   function onevent(args) {
      console.log("Event:", args[0]);
   }
   session.subscribe('com.myapp.hello', onevent);

   // 2) publish an event
   session.publish('com.myapp.hello', ['Hello, world!']);

   // 3) register a procedure for remoting
   function add2(args) {
      return args[0] + args[1];
   }
   session.register('com.myapp.add2', add2);

   // 4) call a remote procedure
   session.call('com.myapp.add2', [2, 3]).then(
      function (res) {
         console.log("Result:", res);
      }
   );
};

connection.open();
```

Features
--------

* supports WAMP v2, works with any WAMP server
* works both in the browser and Node.js
* provides asynchronous RPC and PubSub messaging patterns
* uses WebSocket or HTTP long-poll as transport
* easy to use Promise-based API
* pluggable promises/deferreds: uses [when.js](https://github.com/cujojs/when) (built-in) with progress support for WAMP progressive calls
* minimal dependencies (when.js for promises, CryptoJS for WAMP-CRA auth)
* small size (~250kB source, ~110kB minified, ~35kB gzipped)
* Open-Source (MIT License)


## Get it

### Browser Development

The *latest* built release of AutobahnJS can be retrieved by cloning [this](https://github.com/crossbario/autobahn-js-browser) repository. You can then host the library wherever you need to.

This also contains a complete history of previous releases and can be used with **[Bower](http://bower.io/)**. To install:

	bower install autobahn


### Node.js Development

AutobahnJS is available via npm [here](https://www.npmjs.org/package/autobahn). To install:

```console
npm install autobahn
```

#### Supported Node.js Versions

AutobahnJS is tested and supported on the following Node.js versions:

| Version | Status | Support Until |
|---------|--------|---------------|
| 22.x | Maintenance LTS | Apr 2027 |
| 24.x | **Active LTS** "Krypton" | Apr 2028 |
| 25.x | Current | — |

**Recommendation:** Use Node.js 24.x (Active LTS) for production deployments.

For the latest Node.js release schedule, see [nodejs.org/about/previous-releases](https://nodejs.org/en/about/previous-releases).

#### WebSocket Support

Node.js 22+ includes native WebSocket support. AutobahnJS uses this native implementation directly—no external WebSocket library is required.

#### Quick Check

Verify your installation:

```console
node -e "var autobahn = require('autobahn'); console.log('AutobahnJS version:', autobahn.version);"
```

## More information

For more information, take a look at the [project documentation](/doc/README.md). This provides:

* [a quick 'Getting Started'](/doc/getting-started.md)
* [a basic introduction to programming with Autobahn|JS](/doc/programming.md)
* [a list of all examples in this repo](/doc/examples.md)
* [a full API reference](/doc/reference.md)


## Get in touch

Get in touch on our [user forum](https://crossbar.discourse.group/).


## Acknowledgements

**Autobahn**|JS includes code from the following open-source projects

  * [when.js](https://github.com/cujojs/when) — Promise/A+ implementation with progress support
  * [CryptoJS](http://code.google.com/p/crypto-js/) — Cryptographic functions for WAMP-CRA

Special thanks to the [Coders with an Unhealthy Javascript Obsession](http://cujojs.com/) for creating *when.js - A lightweight Promise and when() implementation, plus other async goodies.*

**Historical note:** Prior to v26.x, AutobahnJS used the excellent [ws](https://github.com/websockets/ws) library for WebSocket support in Node.js. With Node.js 22+ providing native WebSocket, this dependency is no longer needed.
