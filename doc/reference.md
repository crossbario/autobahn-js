# Reference


Library
=======

The library can be included

``` js
try {
   // for Node.js
   var autobahn = require('autobahn');
} catch (e) {
   // for browsers (where AutobahnJS is available globally)
}
```

Autobahn bundles whenjs and cryptojs. These bundled libraries can be accessed like

``` js
try {
   var autobahn = require('autobahn');
   var when = require('when');
   var crypto = require('crypto-js');
} catch (e) {
   var when = autobahn.when;
   var crypto = autobahn.crypto;
}
```

Library Version
---------------

**Autobahn|JS** library version is available (read-only):

    autobahn.version()

which returns a string.

Debug Mode
----------

To enable *debug mode*, define a global variable

    AUTOBAHN_DEBUG = true;

*before* including **Autobahn|JS**. Debug mode works for use both in the browser and in Node.js. When using **Autobahn|JS** in a browser, you'd do e.g.

``` html
<!DOCTYPE html>
<html>
   <body>
      <script>
         AUTOBAHN_DEBUG = true;
      </script>
      <script src="http://path_to_your_hosted_version_of_autobah/autobahn.min.jgz">
     </script>
   </body>
</html>
```

Connections
-----------

A new connection is created using

    autobahn.Connection(options)

which returns an autobahn connection object.

Example: **Create a new connection using WebSocket as a transport**

``` js
var connection = new autobahn.Connection({
                           url: 'ws://127.0.0.1:9000/',
                           realm: 'realm1'
                        });
```

This is the brief syntax which uses the default WebSocket transport and just gives a single connection URL. You can alternatively define a list of transports to try successively - see connection-options.

Connection Methods
------------------

To **open a connection**:

    autobahn.Connection.open()

This will establish an underlying transport and create a new session running over the transport. WebSocket is the default transport, but for environments which do not support WebSocket (like really old browsers) HTTP long-poll can be used as a fallback.

When the transport is lost, automatic reconnection will be attempted. This can be configured using the `options` provided to the constructor of the `Connection` (see [Connection Options](#connection-options)).

To **close a connection**:

    autobahn.connection.close(reason, message)

where both arguments are optional.

* `reason` is a *WAMP URI* providing a closing reason e.g. 'com.myapp.close.signout' to the server side. If no reason is given, the default URI `wamp.goodbye.normal` is sent.
* `message` is a *string*, to be used as a human-readable closing message

This returns a *string* on connection close error, else *undefined*.

When a connection has been closed explicitly, no automatic reconnection will happen.

Connection Callbacks
--------------------

`autobahn.Connection` provides two callbacks:

-   `autobahn.Connection.onopen`
-   `autobahn.Connection.onclose`

The **connection open callback** is fired when the connection has been established and a new session was created. This is the main callback which application code will hook into.

``` js
autobahn.Connection.onopen = function (session, details) {
   // Underlying transport to WAMP router established and new WAMP session started.
   // session is an instance of autobahn.Session
};
```

The **connection open callback** is passed the `autobahn.Session` object which has been created on opening the connection and a details object which contains further information about the session establishment such as the authentication role and ID assigned by the WAMP router.

The **connection close callback** is fired when the connection has been closed explicitly, was lost or could not be established in the first place.

``` js
autobahn.Connection.onclose = function (reason, details) {
   // connection closed, lost or unable to connect
};
```

`reason` is a string with the possible values

-   `"closed"`: The connection was closed explicitly (by the application or server). No automatic reconnection will be tried.
-   `"lost"`: The connection had been formerly established at least once, but now was lost. Automatic reconnection will happen **unless you return truthy** from this callback.
-   `"unreachable"`: The connection could not be established in the first place. No automatic reattempt will happen, since most often the cause is fatal (e.g. invalid server URL or server unreachable)
-   `unsupported`: No WebSocket transport could be created. For security reasons the WebSocket spec states that there should not be any specific errors for network-related issues, so no details are returned in this case either.

`details` is an object containing the `reason` and `message` passed to  `autobahn.Connection.close()`, and thus does not apply in case of `"lost"` or `"unreachable"`.

Connection Options
------------------

The constructor of `autobahn.Connection()` provides various options.

**Required** options:

-   `realm`: *string* - The WAMP realm to join, e.g. `realm1`
-   a target to connect to, for which there are two options:
    - `url`: *string* - the WebSocket URL of the WAMP router to connect to, e.g. `ws://myserver.com:8080/ws` via WebSocket, or
    - a list of transports to try successively

Supported transports are WebSocket and HTTP long-poll.

As an example, with the options below, **Autobahn|JS** first attempts to establish a WebSocket connection and if this fails a HTTP long-poll connection to the respective URLs given.

``` js
var connection = new autobahn.Connection({
   transports: [
      {
         'type': 'websocket',
         'url': 'ws://127.0.0.1:9000/ws'
      },
      {
         'type': 'longpoll',
         'url': 'http://127.0.0.1:9000/lp'
      }
   ],
   realm: 'realm1'
});
```

Not all WAMP routers support all transports, so take a look at the documentation for your router. (The above configuration with both WebSocket and HTTP long-poll on the same port is something which Crossbar.io allows.)

> **note**
>
> We recommend that you use encrypted connections (using TLS). On the client side in **Autobahn|JS**, do this by setting the schema part of the connection URL to `wss` instead of `ws`.

> **note**
>
> When a Web page is served encrypted, then WebSocket connections from the page are also required to be encrypted. The WebSocket spec does intentionally not define any error message for this case, so **Autobahn|JS** returns `unsupported`.

**Optional** options:

Options that control what **kind of Deferreds** to use:

-   `use_es6_promises`: *boolean* - use deferreds based on ES6 promises
-   `use_deferred`: *callable* - if provided, use this deferred constructor, e.g. `jQuery.Deferred` or `Q.defer`, if omitted [when.js](https://github.com/cujojs/when) is used (see their documentation for information on the full range of features)

> **note**
>
> Using ES6-based promises has certain restrictions. E.g. no progressive call results are supported. In general, unless there is a good technical reason, the default deferreds should be used.

Options that control **automatic reconnection**:

-   `max_retries`: *integer* - Maximum number of reconnection attempts. Unlimited if set to -1 (default: **15**)
-   `initial_retry_delay`: *float* - Initial delay for reconnection attempt in seconds (default: **1.5**).
-   `max_retry_delay`: *float* - Maximum delay for reconnection attempts in seconds (default: **300**).
-   `retry_delay_growth`: *float* - The growth factor applied to the retry delay between reconnection attempts (default: **1.5**).
-   `retry_delay_jitter`: *float* - The standard deviation of a Gaussian to jitter the delay on each retry cycle as a fraction of the mean (default: **0.1**).

Options that control **WebSocket subprotocol handling**:

-   `skip_subprotocol_check`: Not yet implemented.
-   `skip_subprotocol_announce`: Not yet implemented.

Connection Properties
---------------------

To get the session object if there is a session currently running over the connection:

    Connection.session

which returns an instance of `autobahn.Session` if there is a session currently running on the connection.

To check whether the connection (the underlying transport for the session) has been established:

    Connection.isConnected

which returns `true` if the Conncetion is open.

A read-only property that signals if the **underlying session is open** and attached to a realm:

    Connection.isOpen

which returns `true` if the underlying session is open.

To check whether the connection is currently in a "try to reconnect" cycle:

    Connection.isRetrying

which returns `true` if reconnects are being attempted.

A property which holds a transport instance when connected

    Connection.transport

which holds a transport instance when connected.

    Connection.transport.info.type

which returns `websocket`, `rawsocket` or `longpoll`

    Connection.transport.info.url

which returns the URL the transport is connected to

    Connection.transport.info.protocol

the WAMP protocol in use, e.g. `wamp.2.json`


A property with the **Deferred factory** in use on this connection:

    Connection.Deferred

returns the Deferred factory function used by the connection.

A Deferred factory for the type of Deferreds (whenjs, ES6, jQuery or Q) in use with the connection:

    Connection.defer()

which returns a Deffered of the type specified in the call to the connection constructor.


Sessions
========

WAMP sessions are instances of `autobahn.Session` that are created by connections:

``` js
var connection = new autobahn.Connection({
                           url: 'ws://127.0.0.1:9000/',
                           realm: 'realm1'
                        });

connection.onopen = function (session) {

   // session is an instance of autobahn.Session

};

connection.open();
```

Session Properties
------------------

Session objects provide a number of properties.

A read-only property with the WAMP **session ID** as an integer:

    Session.id

A read-only property with the **realm** (as a string) the session is attached to:

    Session.realm

A read-only property that signals if the **session is open** (as a boolean) and attached to a realm:

    Session.isOpen

A read-only property with the **features** (as an object) from the WAMP Advanced Profile available on this session (supported by both peers):

    Session.features

A read-only property with an array of all currently **active subscriptions** on this session:

    Session.subscriptions

A read-only property with an array of all currently **active registrations** on this session:

    Session.registrations

A property with the **Deferred factory** in use on this session:

    Session.defer

A Deferred factory for the type of Deferreds (whenjs, ES6, jQuery or Q) in use with the session:

    Session.defer()


Session Logging
---------------

**Autobahn|JS** includes a logging method for convenient logging from sessions.

    Session.log(output)

This can be assigned as an event handler when no `output` argument is used.

`session.log` can be used without an `output` argument when it is assigned as an event handler.

For example:

``` js
connection.onopen = function (session) {

   session.log("Session open.");

   session.call('com.timeservice.now').then(
         session.log;
   );
};
```

which will log to the console:

    WAMP session 2838853860563188 on 'realm1' at 3.902 ms
       Session open.
    WAMP session 2838853860563188 on 'realm1' at 4.679 ms
       2014-03-13T14:09:07Z

where `2014-03-13T14:09:07Z` is the return value of the call to `com.timeservice.now`.

The log method will log the WAMP session ID and the realm of the session, as well as a timestamp that provides the time elapsed since the *construction* of the `autobahn.Session` object.

URI Shortcuts
-------------

Establish an URI prefix to be used as a shortcut in WAMp interactions on `session`:

    Session.prefix(shortcut, prefix)

where

* `shortcut` is a *string*
* `prefix` is an URI part

> **note**
>
> URI prefixes must only contain full URI components, i.e. stop at a '.' separation of an URI. 'com.myapp.topics' is a valid prefix if it is to be used as part of full URI 'com.myapp.topics.one', but invalid if it is intended to be combined with a suffix to form 'com.myapp.topicsnew'.

**Example**:

``` js
session.prefix('api', 'com.myapp.service');
```

You can then use [CURIEs](http://en.wikipedia.org/wiki/CURIE) in addition to URIs:

``` js
session.call('api:add2').then(...);
```

which is equivalent to

``` js
session.call('com.myapp.service.add2').then(...);
```

To remove a prefix:

``` js
session.prefix('api', null);
```

To resolve a prefix *(normally not needed in user code)*:

``` js
session.resolve('api:add2');
```

Session Meta-Events & Procedures
--------------------------------

Some WAMP routers (such as [Crossbar.io](http://crossbar.io)) provide the possibility to subscribe to events which are created by the router based on session lifecycle, as well as procedures which allow the retrieval of information about current sessions. For more information see the [Crossbar.io documenation](http://crossbar.io/docs/Session-Metaevents-and-Procedures/).

Subscribe
=========

To subscribe to a topic on a `session`:

    Session.subscribe(topic, handler, options)

where

* `topic` is the URI of the topic to susbscribe to
* `handler` is the event handler which should consume events
* `options` - options object (see below)

The `handler` must be a callable

    function (args, kwargs, details)

where

1.  `args` is an array with event payload
2.  `kwargs` is an object with event payload
3.  `details` is an object which provides event metadata

Example: **Subscribe to a topic**

``` js
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

or, differently notated, but functionally equivalent

``` js
var d = session.subscribe('com.myapp.topic1', on_event1);

d.then(
   function (subscription) {
      // subscription succeeded, subscription is an instance of autobahn.Subscription
   },
   function (error) {
      // subscription failed, error is an instance of autobahn.Error
   }
);
```

Complete Examples:

-   [PubSub Basic](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/pubsub/basic)

Patter-Based Subscriptions
--------------------------

As a default, topic URIs in subscriptions are matched exactly.

It is possible to change the matching policy to either `prefix` or `wildcard` matching via an option when subscribing, e.g.

``` js
session.subscribe('com.myapp', on_event_all, { match: 'prefix' })
session.subscribe('com.myapp..update', on_event_update, { match: 'wildcard' })
```

In the first case, events for all publications where the topic contains the prefix `com.myapp` will be received, in the second events for all publications which match the wildcard pattern, e.g. `com.myapp.user121.update` and `com.myapp.sensor_23.update`.

Active Subscriptions
--------------------

A list of subscriptions (in no particular order) currently active on a `session` may be accessed via :jsSession.subscriptions.

This returns an array of `autobahn.Subscription` objects. E.g.

``` js
var subs = session.subscriptions;
for (var i = 0; i < subs.length; ++i) {
   console.log("Active subscription with ID " + subs[i].id);
}
```

> **note**
>
> Caution: This property and the subscription objects returned should be considered read-only. DO NOT MODIFY.

Unsubscribing
-------------

You can unsubscribe a previously established `subscription`

    Session.unsubscribe(subscription)

where `subscription` is an instance of `autobahn.Subscrioption` and which returns a *promise* that resolves to a boolean when successful or rejects with an instance of `autobahn.Error` when unsuccessful.

> **note**
>
> If successful, the boolean returned indicates whether the underlying WAMP subscription was actually ended (`true`) or not, since there still are application handlers in place due to multiple client-side subscriptions for the same WAMP subscription to the broker.

Example: **Unsubscribing a subscription**

``` js
var sub1;

session.subscribe('com.myapp.topic1', on_event1).then(
   function (subscription) {
      sub1 = subscription;
   }
);

...

session.unsubscribe(sub1).then(
   function (gone) {
      // successfully unsubscribed sub1
   },
   function (error) {
      // unsubscribe failed
   }
);
```

Complete Examples:

-   [PubSub Unsubscribe](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/pubsub/unsubscribe)

Subscription Meta-Events and Procedures
---------------------------------------

Some WAMP routers (such as [Crossbar.io](http://crossbar.io)) provide the possibility to subscribe to events which are created by the router based on subscription lifecycle, as well as procedures which allow the retrieval of information about current subscriptions. For more information see the [Crossbar.io documenation](http://crossbar.io/docs/Subscription-Meta-Events-and-Procedures/).

Publish
=======

To publish an event on a `session`:

    Session.publish(topic, args, kwargs, options)

where

* `topic`is the URI of the topic to publish to
* `args` is an *optional* array as application event payload
* `kwargs` is an *optional* object as application event payload
* `options` is an *optional* object which specifies options for publication (see below)

and which returns a *promise* if `options.acknowledge` is set, else nothing.

Examples: **Publish an event**

``` js
session.publish('com.myapp.hello', ['Hello, world!']);
```

``` js
session.publish('com.myapp.hello', [], { text: 'Hello, world' })
```

Complete Examples:

-   [PubSub Basic](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/pubsub/basic)
-   [PubSub Complex Payload](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/pubsub/complex)

Acknowledgement
---------------

By default, a publish is not acknowledged by the *Broker*, and the *Publisher* receives no feedback whether the publish was indeed successful or not.

If supported by the *Broker*, a *Publisher* may request acknowledgement of a publish via the option `acknowledge` set to `true`.

With acknowledged publish, the publish method will return a promise that will resolve to an instance of `autobahn.Publication` when the publish was successful, or reject with an `autobahn.Error` when the publish was unsuccessful.

Example: **Publish with acknowledge**

``` js
session.publish('com.myapp.hello', ['Hello, world!'], {}, {acknowledge: true}).then(
   function (publication) {
      // publish was successful
   },
   function (error) {
      // publish failed
   };
);
```

Receiver Black-/Whitelisting
----------------------------

If the feature is supported by the *Broker*, a *Publisher* may restrict the actual receivers of an event beyond those subscribed via the options

-   `exclude`
-   `eligible`

`exclude` is an array of WAMP session IDs providing an explicit list of (potential) *Subscribers* that won't receive a published event, even though they might be subscribed. In other words, `exclude` is a blacklist of (potential) *Subscribers*.

`eligible` is an array of WAMP session IDs providing an explicit list of (potential) *Subscribers* that are allowed to receive a published event. In other words, `eligible` is a whitelist of (potential) *Subscribers*.

The *Broker* will dispatch events published only to *Subscribers* that are not explicitly excluded via `exclude` **and** which are explicitly eligible via `eligible`.

Example: **Publish with exclude**

``` js
session.publish('com.myapp.hello', ['Hello, world!'], {}, {exclude: [123, 456]});
```

The event will be received by all *Subscribers* to topic `com.myapp.hello`, but not the sessions with IDs `123` and `456` (if those sessions are subscribed anyway).

Example: **Publish with eligible**

``` js
session.publish('com.myapp.hello', ['Hello, world!'], {}, {eligible: [123, 456]});
```

The event will be received by the sessions with IDs `123` and `456`, if those sessions are subscribed to topic `com.myapp.hello`.

Publisher Exclusion
-------------------

By default, a *Publisher* of an event will not itself receive an event published, even when subscribed to the topic the *Publisher* is publishing to.

If supported by the *Broker*, this behavior can be overridden via the option `exclude_me` set to `false`.

Example: **Publish without excluding publisher**

``` js
session.publish('com.myapp.hello', ['Hello, world!'], {}, {exclude_me: false});
```


Register
========

To register a procedure on a `session` for remoting:

    Session.register(procedure, endpoint, options)

where

* procedure is the URI of the procedure to register
* endpoint is the function that provides the procedure implementation
* options is an *optional* object which specifies options for registration (see below)

and which returns a *promise* that resolves to an instance of `autobahn.Registration` when successful, or rejects with an instance of `autobahn.Error` when unsuccessful.

The `endpoint` must be a callable

> function (args, kwargs, details)

where

1.  `args` is an array with call arguments
2.  `kwargs` is an object with call arguments
3.  `details` is an object which provides call metadata

and which returns either a plain value or a promise, and the value is serializable or an instance of `autobahn.Result`.

The `autobahn.Result` wrapper is used when returning a complex value (multiple positional return values and/or keyword return values).

Example: **Register a procedure**

``` js
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

When the procedure which you are registering works asynchronous, you can return a promise which is resolved when the asynchronous part has completed:

``` js
function myAsyncFunction(args, kwargs, details) {
   var d = new autobahn.when.defer();

   setTimeout(function() {
      d.resolve("async finished");
   }, 1000);

   return d.promise;
}
```

The above example uses the default promises library for AutobahnJS, when. The syntax may vary for other libraries.

Complete Examples:

-   [RPC Time Service](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/rpc/timeservice)
-   [RPC Arguments](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/rpc/arguments)
-   [RPC Complex Result](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/rpc/complex)
-   [RPC Slow Square](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/rpc/slowsquare)

Pattern-Based Registrations
---------------------------

As a default, URIs in registrations are matched exactly.

It is possible to change the matching policy to either `prefix` or `wildcard` matching via an option when registering, e.g.

``` js
session.register('com.myapp', handle_all, { match: 'prefix' })
```

or

``` js
session.register('com.myapp..update', handle_updates, { match: 'wildcard' })
```

In the first case, calls for where the URI contains the prefix `com.myapp` will lead to the callee being invoked, while in the second calls where the URI matches the wildcard pattern will lead to the callee being invoked, e.g. `com.myapp.user121.update` and `com.myapp.sensor_23.update`.

Shared Registrations
--------------------

As a default, only a single registration per URI is allowed, with an existing registration blocking all subsequent attempts.

It is possible to have shared registrations, i.e. more than one registration for an URI. This does not change the fact that only a single calle is invoked for each call. There are four invocation rules which determine how a callee is determined:

-   `first` - first registration in the list is invoked
-   `last` - last registration in the list is invoked
-   `roundrobing` - the registration following the last invoked registration on the list is invoked
-   `random` - a random registration from the list is invoked

The invocation policy for an URI is determined by the first registration for that URI, and only subsequent registration attemps which set the same invocation rule may be successful. For example, with a first registration of

``` js
session.register('com.myapp.procedure1', handle_all, { invoke: 'random' })
```

any subsequent registration which does not set `invoke: 'random'` will be rejected.

Active Registrations
--------------------

A list of registrations (in no particular order) currently active on a `session` may be accessed like via `Session.registrations`.

This returns an array of `autobahn.Registration` objects. E.g.

``` js
var regs = session.registrations;
for (var i = 0; i < regs.length; ++i) {
   console.log("Active registration with ID " + regs[i].id);
}
```

> **note**
>
> Caution: This property and the registration objects returned should be considered read-only. DO NOT MODIFY.

Unregistering
-------------

You can unregister a previously established `registration`

    Session.unregister(registration)

where registration is an instance of autobahn.Registration and which returns a *promise* that resolves with no value when successful or rejects with an instance of ``autobahn.Error`` when unsuccessful.


Example: **Unregistering a registration**

``` js
var reg1;

session.register('com.myapp.proc1', myproc1).then(
   function (registration) {
      reg1 = registration;
   }
);

...

session.unregister(reg1).then(
   function () {
      // successfully unregistered reg1
   },
   function (error) {
      // unregister failed
   }
);
```

Registration Meta-Events and Procedures
---------------------------------------

Some WAMP routers (such as [Crossbar.io](http://crossbar.io)) provide the possibility to subscribe to events which are created by the router based on registration lifecycle, as well as procedures which allow the retrieval of information about current registrations. For more information see the [Crossbar.io documenation](http://crossbar.io/docs/Registration-Meta-Events-and-Procedures/).

Call
====

To call a remote procedure from a `session`:

    Session.call(procedure, args, kwargs, options)

where

* `procedure` is the URI of the procedure to call
* `args` is an *optional* optional array of call arguments
* `kwargs` is an *optional* object of call arguments
* `options` is an *optional* object with options for the call (see below)

and which returns a *promise* that will resolve to the call result if successful (either a plain value or an instance of `autobahn.Result`) or reject with an instance of `autobahn.Error`.

Example: **Call a procedure**

``` js
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

-   [RPC Time Service](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/rpc/timeservice)
-   [RPC Arguments](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/rpc/arguments)
-   [RPC Complex Result](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/rpc/complex)
-   [RPC Slow Square](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/rpc/slowsquare)

Errors
------

On an error with a PRC call, a error object is passed to the error handler defined in the call. This has three properties:

-   error URI
-   an array of error arguments
-   an object with error arguments

Throwing an error in a registered procedure can happen in one of two ways:

-   by defining an array of error arguments
-   by creating a `autobahn.Error` object

In the first case, the `error URI` is set to a default value, and the object of error arguments remains emtpy, i.e. if you do

``` js
throw ['this is just an error', 'with an array of arguments'];
```

logging this in the caller will come out something like

    wamp.error.runtime_error ["this is just an error", "with an array of arguments"] Object {}

When defining an `autobahn.Error` object, all three properties can be defined. I.e. doing

``` js
throw new autobahn.Error('com.myapp.error', ['this is a more complex error'], {a: 23, b: 9});
```

and logging this in the caller will lead to something like

    com.myapp.error ['this is a more complex error'] Object {a: 23, b: 9}

Complete Examples:

-   [RPC Errors](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/rpc/errors)

Progressive Results
-------------------

Instead of returning just a single, final result, a remote procedure can return progressive results, if this is requested by the caller.

Progressive results are part of the advanced spec for WAMP, and may not be supported by all WAMP routers.

An example for a call requesting progressive call results would be

``` js
session.call('com.myapp.longop', [10], {}, {receive_progress: true}).then(
   function (res) {
      console.log("Final:", res);
      connection.close();
   },
   function (err) {
   },
   function (progress) {
      console.log(progress);
   }
);
```

Here a third callback has been added, which is fired on each receipt of a progressive result event.

In the backend, the function for returning progressive results could be something like

``` js
if (details.progress) {
   for (var i = 0; i < 5; i++) {
      details.progress(i);
   }
   return "progressive result"
} else {
   return "single result";
}
```

which would return 5 progressive result events (each with the current value of `i` as the payload) before returning `"progressive result"` as the final result.

Complete Examples:

-   [RPC Progress](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/rpc/progress)

Caller Identification
---------------------

If the feature is supported by the *Dealer*, a *Caller* may request the disclosure of its identity (its WAMP session ID) to the invoked *Callee* via the option `disclose_me` set to `true`.

Example: **Call with caller disclosure**

``` js
session.call('com.myapp.procedure1', ['Hello, world!'], {}, {disclose_me: true});
```

If the *Dealer* allows the disclosure, the callee can consume the *Caller's* session ID like this:

``` js
function on_call(args, kwargs, details) {
  // details.caller provides the Publisher's WAMP session ID
}

session.register(on_call, 'com.myapp.procedure1');
```
