# **Autobahn**|JS

**Autobahn**|JS is a subproject of the [Autobahn project](http://autobahn.ws/) and provides an open-source implementation of the **[Web Application Messaging Protocol V2](http://wamp.ws/)** in JavaScript

It is licensed under the [MIT license](/LICENSE).

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

The *latest* release of AutobahnJS can be downloaded from here:

 * [https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.js](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.js)
 * [https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.js](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.js)
 * [https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz)

*Previous* releases are available under respective links containing the version number:

 * [https://autobahn.s3.amazonaws.com/autobahnjs/0.9.4-2/autobahn.js](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.js)
 * [https://autobahn.s3.amazonaws.com/autobahnjs/0.9.4-2/autobahn.min.js](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.js)
 * [https://autobahn.s3.amazonaws.com/autobahnjs/0.9.4-2/autobahn.min.jgz](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz)

A **complete history** of AutobahnJS releases is also available from the [built repository](https://github.com/crossbario/autobahn-js-built).

The latter can also be used with **[Bower](http://bower.io/)**:

	bower install autobahn


### NodeJS Development

AutobahnJS is available via the Node package manager [here](https://www.npmjs.org/package/autobahn). To install:

	npm install autobahn


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
