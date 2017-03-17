# Programming

This guide gives an introduction to programming with [WAMP](http://wamp.ws) in JavaScript using **Autobahn|JS**.

WAMP provides two communication patterns for application components to talk to each other

-   [routed Remote Procedure Calls (rRPC)](#remote-procedure-calls)
-   [Publish and Subscribe (PubSub)](#publish-and-subscribe)

and we will cover all four interactions involved in above patterns

1.  [Registering procedures](#registering-procedures) for remote calling
2.  [Calling Procedures](#calling-procedures) remotely
3.  [Subscribing to Topics](#subscribing-to-topics) for receiving events
4.  [Publishing Events](#publishing-events) to topics

> **tip**
>
> If you are new to WAMP or want to learn more about the design principles behind WAMP, we have a longer text [here](http://wamp.ws/why/).

------------------------------------------------------------------------

Application Components
======================

WAMP is all about creating systems from loosely coupled *application components*. It is these application components contain your application code. Your browser frontend and your NodeJS backend would each be an application component.

A WAMP based system consists of potentially many application components, which all connect to a WAMP router. The router is *generic*, which means, it does *not* run any application code, but only provides routing of events and calls.

Hence, to create a WAMP application, you

1.  write application components
2.  connect the components to a router

Including Autobahn
==================

We need to include the **Autobahn|JS** library in our JavaScript. There are instructions in [Getting Started](/getting-started.md) for how to do this in the browser and in Node.js. This also links to available WAMP routers. In this documentation use of [Crossbar.io](http://crossbar.io) is assumed, but examples should work with other routers as well.

Establishing a WAMP connection
==============================

Connections are handled via an **Autobahn|JS** `connection` object, which is created by

``` js
var connection = new autobahn.Connection({
   url: "ws://127.0.0.1:8080/ws",
   realm: "votesapp"
});
```

-   WAMP uses WebSocket as its standard transport - so the url uses the `ws` **scheme** for WebSocket instead of `http` (or `wss` for secure WebSocket connections). For using alternative transports see the reference for connection options.
-   Since we're running our WAMP router locally, we use localhost (i.e. `127.0.0.1`) as the **IP**.
-   The **port** (`8080`) and **path** (`/ws`) for the WebSocket endpoint that we're connecting to can be configured in Crossbar.io, the WAMP router we are using. (This allows serving Web assets under different paths on the same IP.)
-   Each connection is connected to a **Realm**. A Realm is a routing namespace and an administrative domain for WAMP. For example, a single WAMP router can manage multiple Realms, and those realms are completely separate: an event published to topic T on a Realm R1 is NOT received by a subscribe to T on Realm R2.

The `connection` object has two **hooks for callbacks**:

-   `onopen` fires on successful establishment of the connection
-   `onclose` fires on the connection establishment failing or when the established connection closes

We define what happens in each case:

``` js
connection.onopen = function (session, details) {
   // Publish, Subscribe, Call and Register
};


connection.onclose = function (reason, details) {
   // handle connection lost
}
```

The `onopen` handler receives an **Autobahn|JS** `session` object and a dictionary of connection details. All subsequent WAMP PubSub and RPC interaction occurs using the `session` object.

The `onclose` handler receives a reason for closing as well as details.

You open the connection by doing:

``` js
connection.open();
```

Remote Procedure Calls
======================

**routed Remote Procedure Call (rRPC)** is a messaging pattern involving peers of three roles:

-   *Caller*
-   *Callee*
-   *Dealer*

A *Caller* issues calls to remote procedures by providing the procedure URI and any arguments for the call. The *Callee* executes the procedure using the supplied arguments to the call and return the result of the call to the Caller.

*Callees* register procedures they provide with *Dealers*. *Callers* initiate procedure calls first to *Dealers*. *Dealers* route calls incoming from *Callers* to *Callees* implementing the procedure called, and route call results back from *Callees* to *Callers*.

The *Caller* and *Callee* run application code, while the *Dealer* works as a generic router for remote procedure calls decoupling *Callers* and *Callees*.

Registering Procedures
----------------------

To make a procedure available for remote calling, the procedure needs to be *registered*. Registering a procedure is done by calling the `register` method on the `session` object:

``` js
connection.onopen(session, details) {
   var add2 = function(args) {
      return args[0] + args[1];
   };

   session.register('com.myapp.add2', add2);
}
```

The procedure `add2` is registered (line 6) under the URI `'com.myapp.add2'` once the `onopen` callback fires (i.e. the session has connected to a **Router** and joined a **Realm**).

When the registration succeeds, authorized callers will immediately be able to call the procedure (see calling-procedures) using the URI under which it was registered (`com.myapp.add2`).

A registration may also fail, e.g. when a procedure is already registered under the given URI or when the session is not authorized to register procedures.

Function registration needs to provide an **indentifier** which is used by the client when calling the function. For these WAMP uses **URIs**, (i.e. here `'com.myapp.add2'`), in Java packet notation. URIs are an established, easy way for namespace management.

Calling Procedures
------------------

Calling a procedure (that has been previously registered) is done using the `call` method on the `session` object.

Here is how you call the procedure `add2` that we registered above:

``` js
session.call('com.myapp.add2', [2, 3]).then(function showSum(res) {
   console.log('sum is', res);
}, session.log);
```

In the caller, on a successful return the **success handler** function is fired, i.e. the first function pass as an argument after `then`. The result (`res`) of the call is passed to it.

In case of failure of the call, the router returns an error object. This is passed as an argument to the second callback we define, our **error handler**. Here we use the `log` function on the `session` object to log both the error code and some additional information about the session.

> **note**
>
> For calls, **Autobahn|JS** uses **promises**, not conventional callbacks. **Promises** offer powerful features for async programming, and allow you to do way more than is shown here. However, is used with the above pattern, you can think of them just like a different notation for callbacks. If you want to learn more about promises, [this article](http://www.html5rocks.com/en/tutorials/es6/promises/) is a good place to start. As a default, [when.js](https://github.com/cujojs/when) is used for promises, but you can change this as part of the connecting options (see reference).

Publish & Subscribe
===================

**Publish & Subscribe (PubSub)** is a messaging pattern involving peers of three roles:

-   *Publisher*
-   *Subscriber*
-   *Broker*

A *Publisher* publishes events to topics by providing the topic URI and any payload for the event. Subscribers of the topic will receive the event together with the event payload. Publishing can include some options for whitelisting and blacklisting receivers (among other things).

*Subscribers* subscribe to topics they are interested in with *Brokers*. *Publishers* initiate publication first at *Brokers*. *Brokers* route events incoming from *Publishers* to *Subscribers* that are subscribed to respective topics.

The *Publisher* and *Subscriber* will usually run application code, while the *Broker* works as a generic router for events decoupling *Publishers* from *Subscribers*.

Subscribing to Topics
---------------------

To receive events published to a topic, a session needs to first subscribe to the topic.

Subscribing to a topic is done by calling the `subscribe` method on the `session` object:

``` js
var onCounter = function(args) {
   console.log('counter is', args[0]);
}

session.subscribe("com.myapp.oncounter", onCounter);
```

We define an **event handler function** `onCounter` which is called whenever an event for the topic is received.

To subscribe (line 5) we provide the event handler function (`onCounter`) and the URI of the topic to which we want to subscribe (`'com.myapp.oncounter'`).

When the subscription succeeds, we will receive any events published to `'com.myapp.oncounter'`. Note that we won't receive events published *before* the subscription succeeds.

You may also include an optional third argument which is a dictionary of options. Valid options:

- `match`: one of "exact" (the default), "prefix" or "wildcard". See [crossbar.io's subscription documentation](http://crossbar.io/docs/Pattern-Based-Subscriptions/)
- `get_retained`: bool, default `false`. If `true` the subscriber gets a retained event from the broker (if any).

Publishing Events
-----------------

Publishing an event to a topic is done by calling the `publish` method on the `session` object.

``` js
session.publish('com.myapp.oncounter', [1]);
session.publish('com.myapp.complex', [1, 2, 3], {foo: "bar"}, {exclude_me: false});
```

The first arg is a string, a topic WAMP URI. The second argument is a list of `args` and the third argument is a dictionary of `kwargs`.

You may also include a forth argument containing options. These require support from the router to work (for example, see [crossbar.io's white/black listing documentation](http://crossbar.io/docs/Subscriber-Black-and-Whitelisting/). Valid options are:

- `eligible`: a list of session-id's that are allowed to receive the event
- `eligible_authid`: a list of strings of session authid's which are allowed to receive the publish
- `eligible_authrole`: a list of strings of authrole's which can receive the publish
- `exclude`: blacklist by session-id's
- `exclude_authid`: blacklist by `authid`s
- `exclude_authrole`: blacklist by `authrole`s
- `retain`: bool, default `false`. Request broker to retain the event.
- `acknowledge`: bool, default `false`. Request a notification from the broker when the event has been accepted (this does **not** wait for all subscribers to actually receive the event).
- `exclude_me`: bool, default `true`. If `false`, the sending session will also receive the publish (if it is subscribed).

> **tip**
>
> By default, a publisher will not receive an event it publishes even when the publisher is *itself* subscribed to the topic subscribed to. This behavior can be overridden by passing `exclude_me: False` in the options.

> **tip**
>
> By default, publications are *unacknowledged*. This means, a `publish()` may fail *silently* (like when the session is not authorized to publish to the given topic). This behavior can be overridden.

Where to go from here
=====================

-   For more features of **Autobahn|JS** and details about RPC and PubSub, see the [Reference](reference.md).
-   There's an overview of example code for specific WAMP features [Examples Overview](examples.md).
-   Read about [the idea behind WAMP.](http://wamp.ws/why/)
