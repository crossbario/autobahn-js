# **Autobahn**|JS

**Autobahn**|JS is a subproject of the [Autobahn project](http://autobahn.ws/) and provides an open-source implementation of the **[Web Application Messaging Protocol V2](http://wamp.ws/)** in JavaScript

It is licensed under the [MIT licensed](/LICENSE).

WAMP provides asynchronous **Remote Procedure Calls** and **Publish & Subscribe** for applications in *one* protocol running over [WebSocket](http://tools.ietf.org/html/rfc6455) (and fallback transports for old browsers).

**Autobahn**|JS runs on both **Web browsers** and **[Node.js](http://nodejs.org/)**.

WAMP enables application architectures with application code distributed freely across processes and devices according to functional aspects. Since WAMP implementations exist for multiple languages, WAMP applications can be polyglott. Application components can be implemented in a language and run on a device which best fit the particular use case.

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

A **complete history** of AutobahnJS releases is also available from the [built repository](https://github.com/tavendo/AutobahnJSbuilt).

The latter can also be used with **[Bower](http://bower.io/)**:

	bower install autobahn


### NodeJS Development

AutobahnJS is available via the Node package manager [here](https://www.npmjs.org/package/autobahn). To install:

	npm install autobahn


## More information

For more information, take a look at the [project documentation](http://autobahn.ws/js). This provides:

* [a quick 'Getting Started'](http://autobahn.ws/js/gettingstarted.html)
* [tutorials on RPC and PubSub](http://autobahn.ws/js/tutorial.html)
* [a list of all examples in this repo](http://autobahn.ws/js/examples_overview.html)
* [a full API reference](http://autobahn.ws/js/reference.html)


## Get in touch

Get in touch on IRC `#autobahn` on `chat.freenode.net` or the [mailing list](http://groups.google.com/group/autobahnws).


## Acknowledgements

**Autobahn**|JS includes code from the following open-source projects

  * [when.js](https://github.com/cujojs/when)
  * [ws: a node.js websocket library](https://github.com/einaros/ws)
  * [CryptoJS](http://code.google.com/p/crypto-js/)

Special thanks to the [Coders with an Unhealthy Javascript Obsession](http://cujojs.com/) for creating *when.js - A lightweight Promise and when() implementation, plus other async goodies.*
