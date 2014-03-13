# **Autobahn**|JS

**Autobahn**|JS implements **[The Web Application Messaging Protocol V2](http://wamp.ws/)** in JavaScript.

WAMP provides asynchronous **Remote Procedure Calls** and **Publish & Subscribe** for applications in *one* protocol running over [WebSocket](http://tools.ietf.org/html/rfc6455).

**Autobahn**|JS runs on both **Web browsers** and **[Node.js](http://nodejs.org/)**, and implements the following WAMP roles:

1. Caller
2. Callee
3. Publisher
4. Subscriber

**Autobahn**|JS is part of the [Autobahn project](http://autobahn.ws/), [MIT licensed](/LICENSE), and the full source code can be found on [GitHub](https://github.com/tavendo/**Autobahn**|JS/).


# Show me some code!

Here is what programming with **Autobahn**|JS looks like (identical code runs in browsers and on Node.js):

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


# Getting started

With **Autobahn**|JS, you can develop application components in JavaScript, and those components can be hosted inside browsers and Node.js as well as PostgreSQL in a future release.

To provide the communication between the components of your application, you need a WAMP v2 compatible **application router**.

> The application router is responsible for call and event routing between your application's components. The router itself will not run any application code.
>
> WAMP implementations need to catch up with V2 of WAMP, and currently, the only WAMP v2 compatible routers are [**Autobahn**|Python](https://github.com/tavendo/AutobahnPython) and [**Crossbar**.io.](https://github.com/crossbario/crossbar)
>

**Crossbar**.io is an integrated server package that can run from configuration files and acts as a generic WAMP router. To get started with **Crossbar**.io, please see the [project GitHub wiki](https://github.com/crossbario/crossbar/wiki/Getting-Started).


## Example Code

You can find complete examples for code running in both the browser and Node.js, using an AutobahnPython application router, [here](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic).


## Node.js

You can get **Autobahn**|JS for Node.js using the Node Package Manager:

	npm install autobahn

and then, in your code

```javascript
var autobahn = require('autobahn')
```

> Ignore any potential error messages regarding missing Visual C++ components. These have no influence on the actual result of the install.

## Browsers

You can get the **latest** (= WAMPv2 only) prebuilt **Autobahn**|JS release from here:

  1. [Production (minimized and gzipped)](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz)
  2. [Production (only minimized)](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.js)
  3. [Development](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.js)

and use it in your HTML like so

```html
<!DOCTYPE html>
<html>
   <body>
      <script src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz">
	  </script>
      <script>
	      console.log("Ok, Autobahn loaded", autobahn.version);
      </script>
   </body>
</html>
```

> You can use above via direct linking for *development purposes*, but do not hotlink for production. This will not work, since we place restrictions on HTTP referers.

The **old** **Autobahn**|JS for WAMPv1 is still available from here:

  1. [Production (minimized and gzipped)](http://autobahn.s3.amazonaws.com/js/autobahn.min.jgz)
  2. [Production (only minimized)](http://autobahn.s3.amazonaws.com/js/autobahn.min.js)
  3. [Development](http://autobahn.s3.amazonaws.com/js/autobahn.js)

### AMD and RequireJS

If you are using a module system like [RequireJS](http://requirejs.org/), you can use **Autobahn**|JS like so:

```html
<!DOCTYPE html>
<html>
<body>
<script src="http://requirejs.org/docs/release/2.1.11/minified/require.js"></script>
<script>
    require.config({
        baseUrl: ".",
        paths: {
            "autobahn": "https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min",
            "when": "https://cdnjs.cloudflare.com/ajax/libs/when/2.7.1/when"
        },
        shim: {
            "autobahn": {
                deps: ["when"]
            }
        }
    });
    require(["autobahn"], function(autobahn) {
        console.log("Ok, Autobahn loaded", autobahn.version);
    });
</script>
</body>
</html>
```

# API

1. [Library](#library)
    * [Library Version](#library-version)
2. [Connections](#connections)
3. [Sessions](#sessions)
4. [URIs](#uris)
5. [Subscribe](#subscribe)
    * [Active Subscriptions](#active-subscriptions)
    * [Unsubscribing](#unsubscribing)
6. [Publish](#publish)
    * [Acknowledgement](#acknowledgement)
    * [Receiver Black-/Whitelisting](#receiver-black-whitelisting)
    * [Publisher Exclusion](#publisher-exclusion)
    * [Publisher Identification](#publisher-identification)
7. [Register](#register)
    * [Active Registrations](#active-registrations)
    * [Unregistering](#unregistering)
8. [Call](#call)
    * [Errors](#errors)
    * [Progressive Results](#progressive-results)


## Library

The library can be included

```javascript
try {
   // for Node.js
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

### Debug Mode

To enable *debug mode*, define a global variable

```
AUTOBAHN_DEBUG = true;
```

*before* including **Autobahn**|JS. E.g.

```html
<!DOCTYPE html>
<html>
   <body>
      <script>
         AUTOBAHN_DEBUG = true;
      </script>
      <script src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz">
	  </script>
   </body>
</html>
```



## Connections

A new connection is created by

```javascript
var connection = new autobahn.Connection(<options|dict>);
```

Here, `options` provides additional connection options (see below).

Example: **Create a new connection**

```javascript
try {
   // for Node.js
   var autobahn = require('autobahn');
} catch (e) {
   // for browsers (where AutobahnJS is available globally)
}

var connection = new autobahn.Connection({url: 'ws://127.0.0.1:9000/', realm: 'realm1'});
```

### Methods

To **open a connection**:

```javascript
autobahn.Connection.open();
```
This will establish an underlying transport (like WebSocket or long-poll) and create a new session running over the transport.

When the transport is lost, automatic reconnection will be done. The latter can be configured using the `options` provided to the constructor of the `Connection` (see below).

To **close a connection**:

```javascript
autobahn.Connection.close(<reason|string>, <message|string>);
```

where

 * `reason` is an optional WAMP URI providing a closing reason, e.g. `com.myapp.close.signout` to the server-side.
 * `message` is an optional (human readable) closing message.

When a connection was closed explicitly, no automatic reconnection will happen.


### Callbacks

`autobahn.Connection` provides two callbacks:

 * `autobahn.Connection.onopen`
 * `autobahn.Connection.onclose`

The **connection open callback**

```javascript
autobahn.Connection.onopen = function (session) {
   // Underlying transport to WAMP router established and new WAMP session started.
   // session is an instance of autobahn.Session
};
```

is fired when the connection has been established and a new session was created. This is the main callback where application code will hook into.

The **connection close callback**

```javascript
autobahn.Connection.onclose = function (<reason|string>, <details|dict>) {
   // connection closed, lost or unable to connect
};
```

is fired when the connection has been closed explicitly, was lost or could not be established in the first place.

Here, the possible values for *reason* are:

 * `"closed"`: The connection was closed explicitly (by the application or server). No automatic reconnection will be tried.
 * `"lost"`: The connection had been formerly established at least once, but now was lost. Automatic reconnection will happen **unless you return falsy** from this callback.
 * `"unreachable"`: The connection could not be established in the first place. No automatic reattempt will happen, since most often the cause is fatal (e.g. invalid server URL or server unreachable)


### Options

The constructor of `autobahn.Connection` provides various options.

Required options:

 * `url|string` (required): the WebSocket URL of the WAMP router to connect to
 * `realm|string` (required): the WAMP realm to join

Options that control what kind of Deferreds to use:

 * `use_es6_promises|bool` (optional): use deferreds based on ES6 promises *
 * `use_deferred|callable` (optional): if provided, use this deferred constructor, e.g. `jQuery.Deferred` or `Q.defer`

> *: Using ES6-based promises has certain restrictions. E.g. no progressive call results are supported.
>

Options that control automatic reconnection:

 * `max_retries|int`: Maximum number of reconnection attempts (default: **15**)
 * `initial_retry_delay|float`: Initial delay for reconnection attempt in seconds (default: **1.5**).
 * `max_retry_delay|float`: Maximum delay for reconnection attempts in seconds (default: **300**).
 * `retry_delay_growth|float`: The growth factor applied to the retry delay between reconnection attempts (default: **1.5**).
 * `retry_delay_jitter|float`: The standard deviation of a Gaussian to jitter the delay on each retry cycle as a fraction of the mean (default: **0.1**).

Options that control WebSocket subprotocol handling:

 * `skip_subprotocol_check`: Not yet implemented.
 * `skip_subprotocol_announce`: Not yet implemented.


### Properties

A read-only property with an instance of `autobahn.Session` if there is a session currently running over the connection:

    Connection.session

A Deferred factory for the type of Deferreds (whenjs, ES6, jQuery or Q) in use with the connection:

	Connection.defer

To check whether the connection (the transport underlying) is established:

	Connection.isOpen

To check whether the connection is currently in a "try to reconnect" cycle:

	Connection.isRetrying



## Sessions

### Session Open

A read-only property that signals if the session is open and attached to a realm.

    Session.isOpen

### Session ID

A read-only property with the session's ID.

    Session.id

### Session Realm

A read-only property with the realm the session is attached to.

    Session.realm

### Supported Roles & Features

A read-only property with all roles and features supported by both peers of the session.

	Session.features

### Deferreds

A factory function to create new Deferreds of the same class as used by the library itself.

	Session.defer

### Active Subscriptions

A read-only property with a list of all subscriptions currently active on the session.

    Session.subscriptions

### Active Registrations

A read-only property with a list of all registrations currently active on the session.

    Session.registrations


## URIs

Establish a prefix:

```javascript
session.prefix('api', 'com.myapp.service');
```

You can then use CURIEs in addition to URIs:

```javascript
session.call('api:add2').then(...);
```

To remove a prefix:

```javascript
session.prefix('api', null);
```

To resolve a prefix (normally not needed in user code):

```javascript
session.resolve('api:add2');
```


## Subscribe

To subscribe to a topic on a `session`:

```javascript
var d = session.subscribe(<topic|uri>, <handler|callable>, <options|dict>);
```
where

 1. `topic` (required): is the URI of the topic to subscribe to
 2. `handler` (required): is the event handler that should consume events
 3. `options` (optional) specifies options for subscription (see below).

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

session.subscribe('com.myapp.topic1', on_event1).then(
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

    <autobahn.Session>.subscriptions

This returns a list of `autobahn.Subscription` objects. E.g.

```javascript
var subs = session.subscriptions;
for (var i = 0; i < subs.length; ++i) {
	console.log("Active subscription with ID " + subs[i].id);
}
```

> Caution: This property and the subscription objects returned should be considered read-only. DO NOT MODIFY.
>


### Unsubscribing

You can unsubscribe a previously established `subscription`

```javascript
var d = <autobahn.Subscription>.unsubscribe();
```

which returns a *promise* that resolves with no result value when successful or rejects with an instance of `autobahn.Error` when unsuccessful.


Example: **Unsubscribing a subscription**

```javascript
var sub1;

session.subscribe('com.myapp.topic1', on_event1).then(
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

If the feature is supported by the *Broker*, a *Publisher* may request the disclosure of its identity (it's WAMP session ID) to receivers of a published event via the option `disclose_me|bool`.

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
var d = session.register(<procedure|uri>, <endpoint|callable>, <options|dict>);
```

where

1. `procedure` (required): the URI of the procedure to register
2. `endpoint` (required): the function that provides the procedure implementation
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

session.register('com.myapp.proc1', myproc1).then(
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

    <autobahn.Session>.registrations

This returns a list of `autobahn.Registration` objects. E.g.

```javascript
var regs = session.registrations;
for (var i = 0; i < regs.length; ++i) {
	console.log("Active registration with ID " + regs[i].id);
}
```

> Caution: This property and the registration objects returned should be considered read-only. DO NOT MODIFY.
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

  * [Node.js](http://nodejs.org/)
  * [Google Closure Compiler](http://dl.google.com/closure-compiler/compiler-latest.zip)
  * [SCons](http://www.scons.org/)
  * [Taschenmesser](https://github.com/oberstet/taschenmesser)
  * [browserify](http://browserify.org/)
  * [ws](http://einaros.github.io/ws/)
  * [crypto-js](https://www.npmjs.org/package/crypto-js)

To install NodeJS (here shown for Ubuntu):

    sudo apt-get install nodejs nodejs-legacy npm

SCons is a Python based build tool, so you will need [Python](http://python.org/) as well.

Taschenmesser is an SCons toolbelt also written in Python. To install Taschenmesser:

    sudo pip install --upgrade taschenmesser[aws,svg]

Set environment variables (here shown for Windows):

  1. `JAVA_HOME` pointing to your Java run-time

  		C:\Program Files\Java\jre7

  2. Add Python and Python script to `PATH`

 		C:\Python27;C:\Python27\Scripts;

  3. Set `JS_COMPILER` pointing to the Google Closure `compiler.jar`

		C:\Program Files\Google Closure\compiler.jar

Set environment variables (here shown for Ubuntu):

    export JS_COMPILER=$HOME/compiler.jar
    export JAVA_HOME=/usr/lib/jvm/default-java

Now clone the repo:

    git clone git@github.com:tavendo/AutobahnJS.git
	 cd autobahnjs

To install JavaScript dependencies

    npm install ws when crypto-js

Then start the build:

    scons

> When using a bash shell under Windows (e.g. git shell), use 'scons.py'.

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
