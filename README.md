# **Autobahn**|JS

**Autobahn**|JS implements **[The Web Application Messaging Protocol V2](http://wamp.ws/)** in JavaScript.

WAMP provides asynchronous **Remote Procedure Calls** and **Publish & Subscribe** for applications in *one* protocol running over [WebSocket](http://tools.ietf.org/html/rfc6455).

**Autobahn**|JS runs on both **Web browsers** and **[Node.js](http://nodejs.org/)**, and implements the following WAMP roles:

1. Caller
2. Callee
3. Publisher
4. Subscriber

**Autobahn**|JS is part of the [Autobahn project](http://autobahn.ws/), [MIT licensed](/LICENSE), and full source code can be found on [GitHub](https://github.com/tavendo/**Autobahn**|JS/).


# Show me some code!

Here is how programming with **Autobahn**|JS looks like (identical code runs in browsers and on NodeJS):

```javascript
var autobahn = require('autobahn');

var connection = new autobahn.Connection({url: 'ws://127.0.0.1:9000/', realm: 'realm1'});

connection.onopen = function (session) {

   // 1) subscribe to a topic
   function onevent(args) {
      console.log("Event:", args[0]);
   }
   session.subscribe(onevent, 'com.myapp.hello');

   // 2) publish an event
   session.publish('com.myapp.hello', ['Hello, world!']);

   // 3) register a procedure for remoting
   function add2(args) {
      return args[0] + args[1];
   }
   session.register(add2, 'com.myapp.add2');

   // 4) call a remote procedure
   session.call('com.myapp.add2', [2, 3]).then(
      function (res) {
         console.log("Result:", res);
      }
   );
};

connection.open();
```


# Getting started

To use **Autobahn**|JS in your application, you need a WAMP v2 compatible **application router**.

The application router is responsible for call and event routing between your application's components. The router itself will not run any application code.

With **Autobahn**|JS, you can program application components in JavaScript, and those components can be hosted in browsers or NodeJS.

WAMP implementations need to catch up with V2 of WAMP, and currently, the only WAMP v2 compatible router is included with [**Autobahn**|Python](https://github.com/tavendo/AutobahnPython).

You can find complete examples [here](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic).


## NodeJS

You can get **Autobahn**|JS for NodeJS using the Node Package Manager:

	npm install autobahn

and then, in your code

	var autobahn = require('autobahn')

## Browsers

You can get the **latest** (= WAMPv2 only) prebuilt **Autobahn**|JS release from here:

  1. [Production (minimized and gzipped)](https://autobahn.s3.amazonaws.com/**Autobahn**|JS/latest/autobahn.min.jgz)
  2. [Production (only minimized)](https://autobahn.s3.amazonaws.com/**Autobahn**|JS/latest/autobahn.min.js)
  3. [Development](https://autobahn.s3.amazonaws.com/**Autobahn**|JS/latest/autobahn.js)

and use in your HTML

```javascript
<!DOCTYPE html>
<html>
   <body>
      <script src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz"></script>
   </body>
</html>
```

> You can use above via direct linking for *development purposes*, but please do not hotlink for production. It won't work anyway, since we restrictions on HTTP referer.

The **old** **Autobahn**|JS for WAMPv1 is still available from here:

  1. [Production (minimized and gzipped)](http://autobahn.s3.amazonaws.com/js/autobahn.min.jgz)
  2. [Production (only minimized)](http://autobahn.s3.amazonaws.com/js/autobahn.min.js)
  3. [Development](http://autobahn.s3.amazonaws.com/js/autobahn.js)


# API

1. [Library](#library)
    * [Library Version](#library-version)
2. [Connections](#connections)
3. [Sessions](#sessions)
4. [Subscribe](#subscribe)
    * [Active Subscriptions](#active-subscriptions) 
    * [Unsubscribing](#unsubscribing)
5. [Publish](#publish)
    * [Acknowledgement](#acknowledgement)
    * [Receiver Black-/Whitelisting](#receiver-black-whitelisting)
    * [Publisher Exclusion](#publisher-exclusion)
    * [Publisher Identification](#publisher-identification)
6. [Register](#register)
    * [Active Registrations](#active-registrations) 
    * [Unregistering](#unregistering)
7. [Call](#call)
    * [Errors](#errors)
    * [Progressive Results](#progressive-results)


## Library

The library can be included

```javascript
try {
   // for NodeJS
   var autobahn = require('autobahn');
} catch (e) {
   // for browsers (where AutobahnJS is available globally)
}
```

Autobahn bundles whenjs and cryptojs, and the bundled libraries can be accessed like this

```javascript
try {
   var autobahn = require('autobahn');
   var when = require('when');
   var crypto = require('crypto-js');
} catch (e) {
   var when = autobahn.when;
   var crypto = autobahn.crypto;
}
```

### Library Version

**Autobahn**|JS library version is available (read-only):

    autobahn.version


## Connections

A new connection is created by

```javascript
var connection = new autobahn.Connection(<options|dict>);
```

Here, `options` provides additional connection options:

 1. `url|string` (required): the WebSocket URL of the WAMP router to connect to
 2. `realm|string` (required): the WAMP realm to join 
 3. `use_es6_promises|bool` (optional): use deferreds based on ES6 promises *
 4. `use_deferred|callable` (optional): if provided, use this deferred constructor, e.g. `jQuery.Deferred` or `Q.defer`
 5. `max_retries`: Not yet implemented.
 6. `retry_delay`: Not yet implemented.
 7. `skip_subprotocol_check`: Not yet implemented.
 8. `skip_subprotocol_announce`: Not yet implemented.

> *: Using ES6-based promises has certain restrictions. E.g. no progressive call results are supported.
> 

Example: **Create a connection**

```javascript
try {
   // for NodeJS
   var autobahn = require('autobahn');
} catch (e) {
   // for browsers (where AutobahnJS is available globally)
}

var connection = new autobahn.Connection({url: 'ws://127.0.0.1:9000/', realm: 'realm1'});
```

`autobahn.Connection` provides two callbacks:

 * `autobahn.Connection.onopen`
 * `autobahn.Connection.onclose`

where

```javascript
autobahn.Connection.onopen = function (session) {
   // Underlying connection to WAMP router established
   // and new WAMP session started.
   // session is an instance of autobahn.Session
};
```

and

```javascript
autobahn.Connection.onclose = function () {
   // underlying connection to WAMP router closed
};
```

To open a connection:

```javascript
autobahn.Connection.open();
```

To close a connection:

```javascript
autobahn.Connection.close();
```


## Sessions

### Session Open

To check if a session is open (that is, successfully joined to a realm):

    Session.isOpen

### Session ID

A Session's ID is available (read-only) when the session is open:

    Session.id

### Session Realm

A Session's realm is available (read-only) when the session is open:

    Session.realm

### Deferreds

Create a new Deferred of the same class as used by the library itself:

	Session.defer()

This returns a new deferred, e.g. a whenjs deferred or a deferred based on ES6 promises.


## Subscribe

To subscribe to a topic on a `session`:

```javascript
var d = session.subscribe(<handler|callable>, <topic|uri>, <options|dict>);
```
where

 1. `handler` (required): is the event handler that should consume events
 1. `topic` (required): is the URI of the topic to subscribe to
 4. `options` (optional) specifies options for subscription (see below).
 
and returns a *promise* that resolves to an instance of `autobahn.Subscription` when successful, or rejects with an instance of `autobahn.Error` when unsuccessful.

The `handler` must be a callable

    function (args, kwargs, details)

where

1. `args` is the (positional) event payload
2. `kwargs` is the (keyword) event payload
3. `details` provides event metadata


Example: **Subscribe to a topic**

```javascript
function on_event1(args, kwargs, details) {
   // event received, do something ..
}

session.subscribe(on_event1, 'com.myapp.topic1').then(
   function (subscription) {
      // subscription succeeded, subscription is an instance of autobahn.Subscription
   },
   function (error) {
      // subscription failed, error is an instance of autobahn.Error
   }
);
```

### Active Subscriptions

A list of subscriptions (in no particular order) currently active on a `session` may be accessed like this:

    autobahn.Session.subscriptions

This returns a list of `autobahn.Subscription` objects.

> Caution: this should be considered read-only. DO NOT MODIFY.
> 


### Unsubscribing

You can unsubscribe a previously established `subscription`

```javascript
var d = <autobahn.Subscription>.unsubscribe();
```

which returns a *promise* that resolves (with no result value) when successful, or rejects with an instance of `autobahn.Error` when unsuccessful.


Example: **Unsubscribing a subscription**

```javascript
var sub1;

session.subscribe(on_event1, 'com.myapp.topic1').then(
   function (subscription) {
      sub1 = subscription;
   }
);

...

sub1.unsubscribe().then(
   function () {
      // successfully unsubscribed sub1
   },
   function (error) {
      // unsubscribe failed
   }
);
```

Complete Examples:

 * [PubSub Unsubscribe](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/unsubscribe)


## Publish

To publish an event on a `session`:

```javascript
var d = session.publish(<topic|uri>, <args|list>, <kwargs|dict>, <options|dict>);
```

where

 1. `topic` (required): is the URI of the topic to publish to
 2. `args` (optional): is application event payload (a *list* giving the positional arguments)
 3. `kwargs` (optional): is application event payload (a *dictionary* giving the keyword arguments)
 4. `options` (optional) specifies options for publication (see below).
 
and returns either nothing or a *promise* if `options.acknowledge` is set.

Example: **Publish an event**

```javascript
session.publish('com.myapp.hello', ['Hello, world!']);
```

Complete Examples:

 * [PubSub Basic](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/basic)
 * [PubSub Complex Payload](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/complex)


### Acknowledgement

By default, a publish is not acknowledged by the *Broker*, and the *Publisher* receives no feedback whether the publish was indeed successful or not.

If supported by the *Broker*, a *Publisher* may request acknowledgement of a publish via the option `acknowledge|bool`.

With acknowledged publish, the publish method will return a promise that will resolve to an instance of `autobahn.Publication` when the publish was successful, or reject with an `autobahn.Error` when the publish was unsuccessful. 

Example: **Publish with acknowledge**

```javascript
session.publish('com.myapp.hello', ['Hello, world!'], {}, {acknowledge: true}).then(
   function (publication) {
      // publish was successful
   },
   function (error) {
      // publish failed
   };
);
```

### Receiver Black-/Whitelisting

If the feature is supported by the *Broker*, a *Publisher* may restrict the actual receivers of an event beyond those subscribed via the options

 * `exclude|list`
 * `eligible|list`

`exclude` is a list of WAMP session IDs providing an explicit list of (potential) *Subscribers* that won't receive a published event, even though they might be subscribed. In other words, `exclude` is a blacklist of (potential) *Subscribers*.

`eligible` is a list of WAMP session IDs providing an explicit list of (potential) *Subscribers* that are allowed to receive a published event. In other words, `eligible` is a whitelist of (potential) *Subscribers*.

The *Broker* will dispatch events published only to *Subscribers+ that are not explicitly excluded via `exclude` **and** which are explicitly eligible via `eligible`.

Example: **Publish with exclude**

```javascript
session.publish('com.myapp.hello', ['Hello, world!'], {}, {exclude: [123, 456]});
```

The event will be received by all *Subscribers* to topic `com.myapp.hello`, but not the sessions with IDs `123` and `456` (if those sessions are subscribed anyway).

Example: **Publish with eligible**

```javascript
session.publish('com.myapp.hello', ['Hello, world!'], {}, {eligible: [123, 456]});
```

The event will be received by the sessions with IDs `123` and `456`, if those sessions are subscribed to topic `com.myapp.hello`.


### Publisher Exclusion

By default, a *Publisher* of an event will not itself receive an event published, even when subscribed to the topic the *Publisher* is publishing to.

If supported by the *Broker*, this behavior can be overridden via the option `exclude_me|bool`.

Example: **Publish without excluding publisher**

```javascript
session.publish('com.myapp.hello', ['Hello, world!'], {}, {exclude_me: false});
```

### Publisher Identification

If the feature is supported by the *Broker*, a *Publisher* may request the disclosure of it's identity (it's WAMP session ID) to receivers of a published event via the option `disclose_me|bool`.

Example: **Publish with publisher disclosure**

```javascript
session.publish('com.myapp.hello', ['Hello, world!'], {}, {disclose_me: true});
```

If the *Broker* allows the disclosure, receivers can consume the *Publisher's* session ID like this:

```javascript
function on_event(args, kwargs, details) {
  // details.publisher provides the Publisher's WAMP session ID
  // details.publication provides the event ID
}

session.subscribe(on_event, 'com.myapp.topic1');
```

## Register

To register a procedure on a `session` for remoting:

```javascript
var d = session.register(<endpoint|callable>, <procedure|uri>, <options|dict>);
```

where

1. `endpoint` (required): the function that provides the procedure implementation
2. `procedure` (required): the URI of the procedure to register
3. `options` (optional): specifies options for registration (see below)

and returns a *promise* that resolves to an instance of `autobahn.Registration` when successful, or rejects with an instance of `autobahn.Error` when unsuccessful.

The `endpoint` must be a callable

    function (args, kwargs, details) => result

where

1. `args` are the (positional) call arguments
2. `kwargs` are the (keyword) call arguments
3. `details` provides call metadata

and which returns either a plain value or a promise, and the value is serializable or an instance of `autobahn.Result`.

The `autobahn.Result` wrapper is used when returning a complex value (multiple positional return values and/or keyword return values).


Example: **Register a procedure**

```javascript
function myproc1(args, kwargs, details) {
   // invocation .. do something and return a plain value or a promise ..
}

session.register(myproc1, 'com.myapp.proc1').then(
   function (registration) {
      // registration succeeded, registration is an instance of autobahn.Registration
   },
   function (error) {
      // registration failed, error is an isntance of autobahn.Error
   }
);
```

Complete Examples:

 * [RPC Time Service](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/timeservice)
 * [RPC Arguments](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/arguments)
 * [RPC Complex Result](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/complex)
 * [RPC Slow Square](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/slowsquare)


### Active Registrations

A list of registrations (in no particular order) currently active on a `session` may be accessed like this:

    autobahn.Session.registrations

This returns a list of `autobahn.Registration` objects.

> Caution: this should be considered read-only. DO NOT MODIFY.
> 


### Unregistering

Write me.


## Call

To call a remote procedure from a `session`:

```javascript
var d = session.call(<procedure|uri>, <args|list>, <kwargs|dict>, <options|dict>);
```

where

 1. `topic` (required): is the URI of the procedure to call
 2. `args` (optional): are (positional) call arguments
 3. `kwargs` (optional): are (keyword) call arguments
 4. `options` (optional) specifies options for the call (see below).
 
and returns a *promise* that will resolve to the call result if successful (either a plain value or an instance of `autobahn.Result`) or reject with an instance of `autobahn.Error`.

Example: **Call a procedure**

```javascript
session.call('com.arguments.add2', [2, 3]).then(
   function (result) {
      // call was successful
   },
   function (error) {
      // call failed
   }
);
```

Complete Examples:

 * [RPC Time Service](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/timeservice)
 * [RPC Arguments](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/arguments)
 * [RPC Complex Result](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/complex)
 * [RPC Slow Square](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/slowsquare)


### Errors

Write me.

Complete Examples:

 * [RPC Errors](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/errors)


### Progressive Results

Write me.

Complete Examples:

 * [RPC Progress](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/progress)



# Building

To build **Autobahn**|JS for use in browsers, you will need

  * [Nodejs](http://nodejs.org/)
  * [Google Closure Compiler](http://dl.google.com/closure-compiler/compiler-latest.zip)
  * [SCons](http://www.scons.org/)
  * [Taschenmesser](https://github.com/oberstet/taschenmesser)

SCons is a Python based build tool, so you will need [Python](http://python.org/) as well. Taschenmesser is an SCons toolbelt also written in Python.

Set environment variables:

  1. `JAVA_HOME` pointing to your Java run-time
   
  		C:\Program Files\Java\jre7

  2. Add Python and Python script to `PATH`
		
 		C:\Python27;C:\Python27\Scripts;

  3. Set `JS_COMPILER` pointing to the Google Closure `compiler.jar`
  
		C:\Program Files\Google Closure\compiler.jar

Now clone the repo:

	git clone git@github.com:tavendo/AutobahnJS.git
	cd autobahnjs

Then start the build:

	scons

This will produce 3 files inside the `build` directory:

    build/autobahn.js
    build/autobahn.min.js
    build/autobahn.min.jgz

To clean up your build:

	scons -uc


# Where to go

For more information, including getting started, tutorials and reference documentation, please visit the project's [homepage](http://autobahn.ws/js).


# Get in touch

Get in touch on IRC `#autobahn` on `chat.freenode.net` or the [mailing list](http://groups.google.com/group/autobahnws).


# Acknowledgements

**Autobahn**|JS includes code from the following open-source projects

  * [when.js](https://github.com/cujojs/when)
  * [ws: a node.js websocket library](https://github.com/einaros/ws)
  * [CryptoJS](http://code.google.com/p/crypto-js/)

Special thanks to the [Coders with an Unhealthy Javascript Obsession](http://cujojs.com/) for creating *when.js - A lightweight Promise and when() implementation, plus other async goodies.*
