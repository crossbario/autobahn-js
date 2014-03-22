.. _reference:


API Reference
=============


Library
-------

The library can be included

.. code-block:: javascript

   try {
      // for Node.js
      var autobahn = require('autobahn');
   } catch (e) {
      // for browsers (where AutobahnJS is available globally)
   }


Autobahn bundles whenjs and cryptojs, and the bundled libraries can be accessed like this

.. code-block:: javascript

   try {
      var autobahn = require('autobahn');
      var when = require('when');
      var crypto = require('crypto-js');
   } catch (e) {
      var when = autobahn.when;
      var crypto = autobahn.crypto;
   }


Library Version
+++++++++++++++

|ab| library version is available (read-only):

::

    autobahn.version

Debug Mode
++++++++++

To enable *debug mode*, define a global variable

::

   AUTOBAHN_DEBUG = true;

*before* including |ab|. E.g.

.. code-block:: html

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


Connections
+++++++++++

A new connection is created by

.. code-block:: javascript

   var connection = new autobahn.Connection(<options|dict>);

Here, ``options`` provides additional connection options (see below).

Example: **Create a new connection**

.. code-block:: javascript

   try {
      // for Node.js
      var autobahn = require('autobahn');
   } catch (e) {
      // for browsers (where AutobahnJS is available globally)
   }

   var connection = new autobahn.Connection({url: 'ws://127.0.0.1:9000/', realm: 'realm1'});


Connection Methods
++++++++++++++++++

To **open a connection**:

.. code-block:: javascript

   autobahn.Connection.open();

This will establish an underlying transport (like WebSocket or long-poll) and create a new session running over the transport.

When the transport is lost, automatic reconnection will be done. The latter can be configured using the ``options`` provided to the constructor of the ``Connection`` (see below).

To **close a connection**:

.. code-block:: javascript

   autobahn.Connection.close(<reason|string>, <message|string>);

where

 * ``reason`` is an optional WAMP URI providing a closing reason, e.g. ``com.myapp.close.signout`` to the server-side.
 * ``message`` is an optional (human readable) closing message.

When a connection has been closed explicitly, no automatic reconnection will happen.


Connection Callbacks
++++++++++++++++++++

``autobahn.Connection`` provides two callbacks:

 * ``autobahn.Connection.onopen``
 * ``autobahn.Connection.onclose``

The **connection open callback**

.. code-block:: javascript

   autobahn.Connection.onopen = function (session) {
      // Underlying transport to WAMP router established and new WAMP session started.
      // session is an instance of autobahn.Session
   };

is fired when the connection has been established and a new session was created. This is the main callback where application code will hook into.

The **connection close callback**

.. code-block:: javascript

   autobahn.Connection.onclose = function (<reason|string>, <details|dict>) {
      // connection closed, lost or unable to connect
   };

is fired when the connection has been closed explicitly, was lost or could not be established in the first place.

Here, the possible values for *reason* are:

 * ``"closed"``: The connection was closed explicitly (by the application or server). No automatic reconnection will be tried.
 * ``"lost"``: The connection had been formerly established at least once, but now was lost. Automatic reconnection will happen **unless you return falsy** from this callback.
 * ``"unreachable"``: The connection could not be established in the first place. No automatic reattempt will happen, since most often the cause is fatal (e.g. invalid server URL or server unreachable)


Connection Options
++++++++++++++++++

The constructor of ``autobahn.Connection`` provides various options.

**Required** options:

 * ``url|string``: The WebSocket URL of the WAMP router to connect to, e.g. ``ws://myserver.com:8080/ws``
 * ``realm|string``: The WAMP realm to join, e.g. ``realm1``

Options that control what **kind of Deferreds** to use:

 * ``use_es6_promises|bool`` (optional): use deferreds based on ES6 promises
 * ``use_deferred|callable`` (optional): if provided, use this deferred constructor, e.g. ``jQuery.Deferred`` or ``Q.defer``

.. note:: Using ES6-based promises has certain restrictions. E.g. no progressive call results are supported.

Options that control **automatic reconnection**:

 * ``max_retries|int``: Maximum number of reconnection attempts (default: **15**)
 * ``initial_retry_delay|float``: Initial delay for reconnection attempt in seconds (default: **1.5**).
 * ``max_retry_delay|float``: Maximum delay for reconnection attempts in seconds (default: **300**).
 * ``retry_delay_growth|float``: The growth factor applied to the retry delay between reconnection attempts (default: **1.5**).
 * ``retry_delay_jitter|float``: The standard deviation of a Gaussian to jitter the delay on each retry cycle as a fraction of the mean (default: **0.1**).

Options that control **WebSocket subprotocol handling**:

 * ``skip_subprotocol_check``: Not yet implemented.
 * ``skip_subprotocol_announce``: Not yet implemented.


Connection Properties
+++++++++++++++++++++

A read-only property with an instance of ``autobahn.Session`` if there is a session currently running over the connection:

::

   Connection.session|<instance of autobahn.Session>

A Deferred factory for the type of Deferreds (whenjs, ES6, jQuery or Q) in use with the connection:

::

   Connection.defer

To check whether the connection (the transport underlying) is established:

::

   Connection.isOpen|bool

To check whether the connection is currently in a "try to reconnect" cycle:

::

   Connection.isRetrying|bool



Sessions
--------

WAMP sessions are instances of ``autobahn.Session`` that are created by connections:

.. code-block:: javascript

   var connection = new autobahn.Connection({url: 'ws://127.0.0.1:9000/', realm: 'realm1'});

   connection.onopen = function (session) {

      // session is an instance of autobahn.Session

   };

   connection.open();


Session Properties
++++++++++++++++++

Session objects provide a number of properties.

A read-only property with the WAMP **session ID**:

::

    Session.id|int

A read-only property with the **realm** the session is attached to:

::

    Session.realm|string

A read-only property that signals if the **session is open** and attached to a realm:

::

    Session.isOpen|bool

A read-only property with the **features** from the WAMP Advanced Profile available on this session (supported by both peers):

::

    Session.features|dict

A read-only property with a list of all currently **active subscriptions** on this session:

::

    Session.subscriptions|list

A read-only property with a list of all currently **active registrations** on this session:

::

    Session.registrations|list

A property with the **Deferred factory** in use on this session:

::

    Session.defer


Session Logging
+++++++++++++++

|ab| includes a logging method for convenient logging from sessions.

For example:

.. code-block:: javascript

   connection.onopen = function (session) {

      session.log("Session open.");

      session.call('com.timeservice.now').then(
         function (now) {
            session.log(now);
         }
      );
   };

which will log to the console:

::

   WAMP session 2838853860563188 on 'realm1' at 3.902 ms
      Session open.
   WAMP session 2838853860563188 on 'realm1' at 4.679 ms
      2014-03-13T14:09:07Z

The log method will log the WAMP session ID and the realm of the session, as well as a timestamp that provides the time elapsed since the *construction* of the ``autobahn.Session`` object.


URI Shortcuts
+++++++++++++

Establish an URI prefix to be used as a shortcut:

.. code-block:: javascript

   session.prefix('api', 'com.myapp.service');

You can then use `CURIEs <http://en.wikipedia.org/wiki/CURIE>`_ in addition to URIs:

.. code-block:: javascript

   session.call('api:add2').then(...);

To remove a prefix:

.. code-block:: javascript

   session.prefix('api', null);

To resolve a prefix (normally not needed in user code):

.. code-block:: javascript

   session.resolve('api:add2');


Subscribe
---------

To subscribe to a topic on a `session`:

.. code-block:: javascript

   var d = session.subscribe(<topic|uri>, <handler|callable>, <options|dict>);

where

 1. ``topic`` (required): is the URI of the topic to subscribe to
 2. ``handler`` (required): is the event handler that should consume events
 3. ``options`` (optional) specifies options for subscription (see below).

and returns a *promise* that resolves to an instance of ``autobahn.Subscription`` when successful, or rejects with an instance of ``autobahn.Error`` when unsuccessful.

The ``handler`` must be a callable

::

    function (args, kwargs, details)

where

1. ``args`` is the (positional) event payload
2. ``kwargs`` is the (keyword) event payload
3. ``details`` provides event metadata


Example: **Subscribe to a topic**

.. code-block:: javascript

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


Active Subscriptions
++++++++++++++++++++

A list of subscriptions (in no particular order) currently active on a ``session`` may be accessed like this:

::

    autobahn.Session.subscriptions

This returns a list of ``autobahn.Subscription`` objects. E.g.

.. code-block:: javascript

   var subs = session.subscriptions;
   for (var i = 0; i < subs.length; ++i) {
      console.log("Active subscription with ID " + subs[i].id);
   }

.. note:: Caution: This property and the subscription objects returned should be considered read-only. DO NOT MODIFY.


Unsubscribing
+++++++++++++

You can unsubscribe a previously established ``subscription``

.. code-block:: javascript

   var d = session.unsubscribe(<instance of autobahn.Subscription>);

which returns a *promise* that resolves with a boolean value when successful or rejects with an instance of ``autobahn.Error`` when unsuccessful.

.. note:: If successful, the boolean returned indicates whether the underlying WAMP subscription was actually ended (``true``) or not, since there still are application handlers in place.


Example: **Unsubscribing a subscription**

.. code-block:: javascript

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


Complete Examples:

 * `PubSub Unsubscribe <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/unsubscribe>`_


Publish
-------

To publish an event on a ``session``:

.. code-block:: javascript

   var d = session.publish(<topic|uri>, <args|list>, <kwargs|dict>, <options|dict>);

where

 1. ``topic`` (required): is the URI of the topic to publish to
 2. ``args`` (optional): is application event payload (a *list* giving the positional arguments)
 3. ``kwargs`` (optional): is application event payload (a *dictionary* giving the keyword arguments)
 4. ``options`` (optional) specifies options for publication (see below).

and returns either nothing or a *promise* if ``options.acknowledge`` is set.

Example: **Publish an event**

.. code-block:: javascript

   session.publish('com.myapp.hello', ['Hello, world!']);

Complete Examples:

 * `PubSub Basic <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/basic>`_
 * `PubSub Complex Payload <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/complex>`_


Acknowledgement
+++++++++++++++

By default, a publish is not acknowledged by the *Broker*, and the *Publisher* receives no feedback whether the publish was indeed successful or not.

If supported by the *Broker*, a *Publisher* may request acknowledgement of a publish via the option ``acknowledge|bool``.

With acknowledged publish, the publish method will return a promise that will resolve to an instance of ``autobahn.Publication`` when the publish was successful, or reject with an ``autobahn.Error`` when the publish was unsuccessful.

Example: **Publish with acknowledge**

.. code-block:: javascript

   session.publish('com.myapp.hello', ['Hello, world!'], {}, {acknowledge: true}).then(
      function (publication) {
         // publish was successful
      },
      function (error) {
         // publish failed
      };
   );


Receiver Black-/Whitelisting
++++++++++++++++++++++++++++

If the feature is supported by the *Broker*, a *Publisher* may restrict the actual receivers of an event beyond those subscribed via the options

 * ``exclude|list``
 * ``eligible|list``

``exclude`` is a list of WAMP session IDs providing an explicit list of (potential) *Subscribers* that won't receive a published event, even though they might be subscribed. In other words, ``exclude`` is a blacklist of (potential) *Subscribers*.

``eligible`` is a list of WAMP session IDs providing an explicit list of (potential) *Subscribers* that are allowed to receive a published event. In other words, ``eligible`` is a whitelist of (potential) *Subscribers*.

The *Broker* will dispatch events published only to *Subscribers* that are not explicitly excluded via ``exclude`` **and** which are explicitly eligible via ``eligible``.

Example: **Publish with exclude**

.. code-block:: javascript

   session.publish('com.myapp.hello', ['Hello, world!'], {}, {exclude: [123, 456]});

The event will be received by all *Subscribers* to topic ``com.myapp.hello``, but not the sessions with IDs ``123`` and ``456`` (if those sessions are subscribed anyway).

Example: **Publish with eligible**

.. code-block:: javascript

   session.publish('com.myapp.hello', ['Hello, world!'], {}, {eligible: [123, 456]});

The event will be received by the sessions with IDs ``123`` and ``456``, if those sessions are subscribed to topic ``com.myapp.hello``.


Publisher Exclusion
+++++++++++++++++++

By default, a *Publisher* of an event will not itself receive an event published, even when subscribed to the topic the *Publisher* is publishing to.

If supported by the *Broker*, this behavior can be overridden via the option ``exclude_me|bool``.

Example: **Publish without excluding publisher**

.. code-block:: javascript

   session.publish('com.myapp.hello', ['Hello, world!'], {}, {exclude_me: false});


Publisher Identification
++++++++++++++++++++++++

If the feature is supported by the *Broker*, a *Publisher* may request the disclosure of its identity (its WAMP session ID) to receivers of a published event via the option ``disclose_me|bool``.

Example: **Publish with publisher disclosure**

.. code-block:: javascript

   session.publish('com.myapp.hello', ['Hello, world!'], {}, {disclose_me: true});

If the *Broker* allows the disclosure, receivers can consume the *Publisher's* session ID like this:

.. code-block:: javascript

   function on_event(args, kwargs, details) {
     // details.publisher provides the Publisher's WAMP session ID
     // details.publication provides the event ID
   }

   session.subscribe(on_event, 'com.myapp.topic1');


Register
--------

To register a procedure on a ``session`` for remoting:

.. code-block:: javascript

   var d = session.register(<procedure|uri>, <endpoint|callable>, <options|dict>);

where

 1. ``procedure`` (required): the URI of the procedure to register
 2. ``endpoint`` (required): the function that provides the procedure implementation
 3. ``options`` (optional): specifies options for registration (see below)

and returns a *promise* that resolves to an instance of ``autobahn.Registration`` when successful, or rejects with an instance of ``autobahn.Error`` when unsuccessful.

The ``endpoint`` must be a callable

::

    function (args, kwargs, details) => result

where

 1. ``args`` are the (positional) call arguments
 2. ``kwargs`` are the (keyword) call arguments
 3. ``details`` provides call metadata

and which returns either a plain value or a promise, and the value is serializable or an instance of ``autobahn.Result``.

The ``autobahn.Result`` wrapper is used when returning a complex value (multiple positional return values and/or keyword return values).


Example: **Register a procedure**

.. code-block:: javascript

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


Complete Examples:

 * `RPC Time Service <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/timeservice>`_
 * `RPC Arguments <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/arguments)>`_
 * `RPC Complex Result <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/complex>`_
 * `RPC Slow Square <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/slowsquare>`_


Active Registrations
++++++++++++++++++++

A list of registrations (in no particular order) currently active on a ``session`` may be accessed like this:

::

    autobahn.Session.registrations

This returns a list of ``autobahn.Registration`` objects. E.g.

.. code-block:: javascript

   var regs = session.registrations;
   for (var i = 0; i < regs.length; ++i) {
      console.log("Active registration with ID " + regs[i].id);
   }

.. note:: Caution: This property and the registration objects returned should be considered read-only. DO NOT MODIFY.


Unregistering
+++++++++++++

You can unregister a previously established ``registration``

.. code-block:: javascript

   var d = session.unregister(<instance of autobahn.Registration>);

which returns a *promise* that resolves with no value when successful or rejects with an instance of ``autobahn.Error`` when unsuccessful.


Example: **Unregistering a registration**

.. code-block:: javascript

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



Call
----

To call a remote procedure from a ``session``:

.. code-block:: javascript

   var d = session.call(<procedure|uri>, <args|list>, <kwargs|dict>, <options|dict>);

where

 1. ``topic`` (required): is the URI of the procedure to call
 2. ``args`` (optional): are (positional) call arguments
 3. ``kwargs`` (optional): are (keyword) call arguments
 4. ``options`` (optional) specifies options for the call (see below).

and returns a *promise* that will resolve to the call result if successful (either a plain value or an instance of ``autobahn.Result``) or reject with an instance of ``autobahn.Error``.

Example: **Call a procedure**

.. code-block:: javascript

   session.call('com.arguments.add2', [2, 3]).then(
      function (result) {
         // call was successful
      },
      function (error) {
         // call failed
      }
   );


Complete Examples:

 * `RPC Time Service <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/timeservice>`_
 * `RPC Arguments <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/arguments>`_
 * `RPC Complex Result <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/complex)>`_
 * `RPC Slow Square <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/slowsquare)>`_


Errors
++++++

Write me.

Complete Examples:

 * `RPC Errors <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/errors>`_


Progressive Results
+++++++++++++++++++

Write me.

Complete Examples:

 * `RPC Progress <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/progress>`_
