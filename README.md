# **Autobahn**|JS

WAMP for Browsers and NodeJS.

[![NPM](https://nodei.co/npm/autobahn.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/autobahn/)

[![Docker Hub](https://img.shields.io/badge/docker-ready-blue.svg)](https://hub.docker.com/r/crossbario/autobahn-js/)

---

**Autobahn**|JS is a subproject of the [Autobahn project](http://autobahn.ws/) and provides an open-source implementation of the **[Web Application Messaging Protocol V2](http://wamp.ws/)** in JavaScript under the [MIT license](/LICENSE).

WAMP provides asynchronous **Remote Procedure Calls** and **Publish & Subscribe** for applications in *one* protocol running over [WebSocket](http://tools.ietf.org/html/rfc6455) (and fallback transports for old browsers).

**Autobahn**|JS runs on both **Web browsers** and **[Node.js](http://nodejs.org/)**.

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
var autobahn = require('autobahn');

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
* pluggable promises/deferreds: use [when.js](https://github.com/cujojs/when)  (built-in), [jQuery](http://api.jquery.com/category/deferred-object/) , [Dojo](http://dojotoolkit.org/reference-guide/1.7/dojo/Deferred.html), ECMA Script 6 or others
* no dependencies
* small size (244kB source, 111kB minified, 33kB compressed)
* Open-Source (MIT License)


## Get it

### Browser Development

The *latest* built release of AutobahnJS can be retrieved by cloning [this](https://github.com/crossbario/autobahn-js-built) repository. You can then host the library wherever you need to.

This also contains a complete history of previous releases and can be used with **[Bower](http://bower.io/)** to:

	bower install autobahn


### NodeJS Development

AutobahnJS is available via the Node package manager [here](https://www.npmjs.org/package/autobahn). To install:

	npm install autobahn

#### NodeJS and ws version

AutobahnJS works with both v1 and v2 of the ws library, and you should use the ws version depending on the NodeJS version you use.

If you run NodeJS v4.5.0 or later, you can use the ws library v2:

```console
npm install ws@2`
```

If you run an earlier version of NodeJS, use must use the ws library v1:

```console
npm install ws@1`
```

**Details**

AutobahnJS currently strives for support of NodeJS v4.2.6 or later. The reason is that this is the version that currently ships with Ubuntu 16.04 LTS.

On NodeJS, we need the [ws library](https://github.com/websockets/ws/) for WebSocket support, as different from browsers, NodeJS does not come with a native implementation.

However, the ws library v2 or later is incompatible with NodeJS earlier than v4.5.0. See [here](http://stackoverflow.com/a/42331959/884770) and [here](https://github.com/websockets/ws/issues/989).

Rather than dropping support for NodeJS v4 (and hence for the system NodeJS version of Ubuntu), we use ws v1 as a dependency in `package.json`, but allow any version of ws to be used.

#### Usage on Ubuntu

As mentioned above, Ubuntu 16.04 ships with Node 4.2, which only works with ws v1. To use that, do the following:

```console
sudo npm install -g ws@1 autobahn
export NODE_PATH=/usr/local/lib/node_modules/
```

> This first install ws at version 1, and then installs Autobahn. When you install Autobahn without installing ws first, the latest ws version will be installed as a dependency of Autobahn, hence ws v2, and that won't work.

To use a current Node with ws v2, do the following:

```console
cd ~
wget https://nodejs.org/dist/v6.10.1/node-v6.10.1-linux-x64.tar.xz
tar xvf node-v6.10.1-linux-x64.tar.xz
export PATH=${HOME}/node-v6.10.1-linux-x64/bin:${PATH}
export NODE_PATH=${HOME}/node-v6.10.1-linux-x64/lib/node_modules
```

This should give you:

```console
oberstet@office-corei7:~$ which node
/home/oberstet/node-v6.10.1-linux-x64/bin/node
oberstet@office-corei7:~$ which npm
/home/oberstet/node-v6.10.1-linux-x64/bin/npm
oberstet@office-corei7:~$ node -v
v6.10.1
oberstet@office-corei7:~$ npm -v
3.10.10
```

Now you can install Autobahn:

```console
npm install -g autobahn
```

and check

```console
oberstet@office-corei7:~$ node -e "var autobahn = require('autobahn'); console.log(autobahn.version);"
0.12.0
```

## More information

For more information, take a look at the [project documentation](/doc/README.md). This provides:

* [a quick 'Getting Started'](/doc/gettingstarted.md)
* [a basic introduction to programming with Autobahn|JS](/doc/programming.md)
* [a list of all examples in this repo](/doc/examples_overview.md)
* [a full API reference](/doc/reference.md)


## Get in touch

Get in touch on IRC `#autobahn` on `chat.freenode.net` or the [mailing list](http://groups.google.com/group/autobahnws).


## Acknowledgements

**Autobahn**|JS includes code from the following open-source projects

  * [when.js](https://github.com/cujojs/when)
  * [ws: a node.js websocket library](https://github.com/einaros/ws)
  * [CryptoJS](http://code.google.com/p/crypto-js/)

Special thanks to the [Coders with an Unhealthy Javascript Obsession](http://cujojs.com/) for creating *when.js - A lightweight Promise and when() implementation, plus other async goodies.*
