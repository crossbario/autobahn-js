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


Autobahn bundles whenjs and cryptojs. These bundled libraries can be accessed like

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

.. js:function:: autobahn.version

   :returns: *string* - version number of loaded library


Debug Mode
++++++++++

To enable *debug mode*, define a global variable

::

   AUTOBAHN_DEBUG = true;

*before* including |ab|. Debug mode works for use both in the browser and in Node.js. When using |ab| in a browser, you'd do e.g.

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

A new connection is created using

.. js:function:: autobahn.Connection(options)

   :param object options: connection options

   :returns: *object* - autobahn connection object

Example: **Create a new connection**

.. code-block:: javascript

   var connection = new autobahn.Connection({
                              url: 'ws://127.0.0.1:9000/',
                              realm: 'realm1'
                           });


Connection Methods
++++++++++++++++++

To **open a connection**:

.. js:function:: autobahn.Connection.open

This will establish an underlying transport (like WebSocket or long-poll) and create a new session running over the transport.

When the transport is lost, automatic reconnection will be attempted. This can be configured using the ``options`` provided to the constructor of the ``Connection`` (see `Connection Options`_).

To **close a connection**:

.. js:function::   autobahn.Connection.close(reason, message)

   :param uri reason: optional WAMP URI providing a closing reason, e.g. ``com.myapp.close.signout`` to the server-side. If no reason is given, the default URI ``wamp.goodbye.normal`` is sent.
   :param string message: optional (human readable) closing message

   :returns: *string* on connection close error, else *undefined*

When a connection has been closed explicitly, no automatic reconnection will happen.


Connection Callbacks
++++++++++++++++++++

``autobahn.Connection`` provides two callbacks:

* ``autobahn.Connection.onopen``
* ``autobahn.Connection.onclose``

The **connection open callback** is fired when the connection has been established and a new session was created. This is the main callback which application code will hook into.

.. code-block:: javascript

   autobahn.Connection.onopen = function (session) {
      // Underlying transport to WAMP router established and new WAMP session started.
      // session is an instance of autobahn.Session
   };

The **connection open callback** is passed the ``autobahn.Session`` object which has been created on opening the connection.

The **connection close callback** is fired when the connection has been closed explicitly, was lost or could not be established in the first place.

.. code-block:: javascript

   autobahn.Connection.onclose = function (reason, details) {
      // connection closed, lost or unable to connect
   };

``reason`` is a string with the possible values

* ``"closed"``: The connection was closed explicitly (by the application or server). No automatic reconnection will be tried.
* ``"lost"``: The connection had been formerly established at least once, but now was lost. Automatic reconnection will happen **unless you return falsy** from this callback.
* ``"unreachable"``: The connection could not be established in the first place. No automatic reattempt will happen, since most often the cause is fatal (e.g. invalid server URL or server unreachable)

``details`` is an object containing the ``reason`` and ``message`` passed to :js:func:`autobahn.Connection.close`, and thus does not apply in case of ``"lost"`` or ``"unreachable"``.

Connection Options
++++++++++++++++++

The constructor of :js:func:`autobahn.Connection` provides various options.

**Required** options:

* ``url``: *string* - the WebSocket URL of the WAMP router to connect to, e.g. ``ws://myserver.com:8080/ws``
* ``realm``: *string* - The WAMP realm to join, e.g. ``realm1``

**Optional** options:

Options that control what **kind of Deferreds** to use:

* ``use_es6_promises``: *boolean* - use deferreds based on ES6 promises
* ``use_deferred``: *callable* - if provided, use this deferred constructor, e.g. ``jQuery.Deferred`` or ``Q.defer``

.. note:: Using ES6-based promises has certain restrictions. E.g. no progressive call results are supported.

Options that control **automatic reconnection**:

* ``max_retries``: *integer* - Maximum number of reconnection attempts (default: **15**)
* ``initial_retry_delay``: *float* - Initial delay for reconnection attempt in seconds (default: **1.5**).
* ``max_retry_delay``: *float* - Maximum delay for reconnection attempts in seconds (default: **300**).
* ``retry_delay_growth``: *float* - The growth factor applied to the retry delay between reconnection attempts (default: **1.5**).
* ``retry_delay_jitter``: *float* - The standard deviation of a Gaussian to jitter the delay on each retry cycle as a fraction of the mean (default: **0.1**).

Options that control **WebSocket subprotocol handling**:

* ``skip_subprotocol_check``: Not yet implemented.
* ``skip_subprotocol_announce``: Not yet implemented.


Connection Properties
+++++++++++++++++++++

To get the session object if there is a session currently running over the connection:

.. js:attribute:: Connection.session

   Returns an instance of ``autobahn.Session`` if there is a session currently running on the connection.

To check whether the connection (the underlying transport for the session) has been established:

.. js:attribute:: Connection.isConnected

   Returns ``true`` if the Connection is open.
   
A read-only property that signals if the **underlying session is open** and attached to a realm:

.. js:attribute:: Connection.isOpen

   Returns ``true`` if the underlying session is open.

To check whether the connection is currently in a "try to reconnect" cycle:

.. js:attribute:: Connection.isRetrying

   Returns ``true`` if reconnects are being attempted.

A property which holds a transport instance when connected

.. js:attribute:: Connection.transport

   Holds a transport instance when connected.

.. js:attribute:: Connection.transport.info.type

   Type of transport: ``websocket`` or ``longpoll``.

.. js:attribute:: Connection.transport.info.url

   The URL the transport is connected to.

.. js:attribute:: Connection.transport.info.protocol

   The WAMP protocol in use, e.g. ``wamp.2.json``.

A property with the **Deferred factory** in use on this connection:

.. js:attribute:: Connection.defer

   Returns the Deferred factory function in use on the connection.


A Deferred factory for the type of Deferreds (whenjs, ES6, jQuery or Q) in use with the connection:

.. js:function:: Connection.defer

   :returns: a Deferred of the type specified in the call to the connection constructor :js:func:`autobahn.Connection`


Sessions
--------

WAMP sessions are instances of ``autobahn.Session`` that are created by connections:

.. code-block:: javascript

   var connection = new autobahn.Connection({
                              url: 'ws://127.0.0.1:9000/',
                              realm: 'realm1'
                           });

   connection.onopen = function (session) {

      // session is an instance of autobahn.Session

   };

   connection.open();


Session Properties
++++++++++++++++++

Session objects provide a number of properties.

A read-only property with the WAMP **session ID**:

.. js:attribute:: Session.id

   Returns the session ID as an integer.

A read-only property with the **realm** the session is attached to:

.. js:attribute:: Session.realm

   Returns the realm the session is attached to as a string.

A read-only property that signals if the **session is open** and attached to a realm:

.. js:attribute:: Session.isOpen

   Returns ``true`` if the session is open.

A read-only property with the **features** from the WAMP Advanced Profile available on this session (supported by both peers):

.. js:attribute:: Session.features

   Returns an object with the roles the client implements and the available advanced features for each role.

A read-only property with an array of all currently **active subscriptions** on this session:

.. js:attribute:: Session.subscriptions

   Returns an array with the subscription objects for all currently active subscriptions.

A read-only property with an array of all currently **active registrations** on this session:

.. js:attribute:: Session.registrations

   Returns an array with the registration objects for all currently active registrations.

A property with the **Deferred factory** in use on this session:

.. js:attribute:: Session.defer

   Returns the Deferred factory function in use on the session.

A Deferred factory for the type of Deferreds (whenjs, ES6, jQuery or Q) in use with the session:

.. js:function:: Session.defer

   :returns: a Deferred of the type specified in the call to the session constructor :js:func:`autobahn.Connection`



Session Logging
+++++++++++++++

|ab| includes a logging method for convenient logging from sessions.


.. js:function:: session.log(output)

   :param any output: *optional* the output to log - any JavaScript data type

``session.log`` can be used without an ``output`` argument when it is assigned as an event handler.

For example:

.. code-block:: javascript

   connection.onopen = function (session) {

      session.log("Session open.");

      session.call('com.timeservice.now').then(
            session.log;
      );
   };

which will log to the console:

::

   WAMP session 2838853860563188 on 'realm1' at 3.902 ms
      Session open.
   WAMP session 2838853860563188 on 'realm1' at 4.679 ms
      2014-03-13T14:09:07Z

where ``2014-03-13T14:09:07Z`` is the return value of the call to ``com.timeservice.now``.

The log method will log the WAMP session ID and the realm of the session, as well as a timestamp that provides the time elapsed since the *construction* of the ``autobahn.Session`` object.


URI Shortcuts
+++++++++++++

Establish an URI prefix to be used as a shortcut in WAMp interactions on ``session``:

.. js:function:: session.prefix(shortcut, prefix)

   :param string shortcut: the shortcut for the provided prefix URI
   :param URI prefix: an URI prefix

.. note:: URI prefixes must only contain full URI components, i.e. stop at a '.' separation of an URI. 'com.myapp.topics' is a valid prefix if it is to be used as part of full URI 'com.myapp.topics.one', but invalid if it is intended to be combined with a suffix to form 'com.myapp.topicsnew'.


**Example**:

.. code-block:: javascript

   session.prefix('api', 'com.myapp.service');

You can then use `CURIEs <http://en.wikipedia.org/wiki/CURIE>`_ in addition to URIs:

.. code-block:: javascript

   session.call('api:add2').then(...);

which is equivalent to

.. code-block:: javascript

   session.call('com.myapp.service.add2').then(...);

To remove a prefix:

.. code-block:: javascript

   session.prefix('api', null);

To resolve a prefix *(normally not needed in user code)*:

.. code-block:: javascript

   session.resolve('api:add2');


Subscribe
---------

To subscribe to a topic on a `session`:

.. js:function:: session.subscribe(topic, handler, options)

   :param URI topic: is the URI of the topic to subscribe to
   :param callable handler: the event handler that should consume events
   :param object options: *optional* - options for subscription (see below)

   :returns: *promise* that resolves to an instance of ``autobahn.Subscription`` when successful, or rejects with an instance of ``autobahn.Error`` when unsuccessful


The ``handler`` must be a callable

::

    function (args, kwargs, details)

where

1. ``args`` is an array with event payload
2. ``kwargs`` is an object with event payload
3. ``details`` is an object which provides event metadata


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

or, differently notated, but functionally equivalent

.. code-block:: javascript

   var d = session.subscribe('com.myapp.topic1', on_event1);

   d.then(
      function (subscription) {
         // subscription succeeded, subscription is an instance of autobahn.Subscription
      },
      function (error) {
         // subscription failed, error is an instance of autobahn.Error
      }
   );

Complete Examples:

* `PubSub Basic <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/basic>`_


Active Subscriptions
++++++++++++++++++++

A list of subscriptions (in no particular order) currently active on a ``session`` may be accessed via :js:attr:`Session.subscriptions`.

This returns an array of ``autobahn.Subscription`` objects. E.g.

.. code-block:: javascript

   var subs = session.subscriptions;
   for (var i = 0; i < subs.length; ++i) {
      console.log("Active subscription with ID " + subs[i].id);
   }

.. note:: Caution: This property and the subscription objects returned should be considered read-only. DO NOT MODIFY.


Unsubscribing
+++++++++++++

You can unsubscribe a previously established ``subscription``

.. js:function:: session.unsubscribe(subscription)

   :param object subscription: an instance of autobahn.Subscription

   :returns: a *promise* that resolves with a boolean value when successful or rejects with an instance of ``autobahn.Error`` when unsuccessful.

.. note:: If successful, the boolean returned indicates whether the underlying WAMP subscription was actually ended (``true``) or not, since there still are application handlers in place due to multiple client-side subscriptions for the same WAMP subscription to the broker.


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

.. js:function:: session.publish(topic, args, kwargs, options)

   :param URI topic: the URI of the topic to publish to
   :param array args: *optional* - application event payload
   :param object kwargs: *optional* - application event payload
   :param object options: *optional* - specifies options for publication (see below)

   :returns: a *promise* if ``options.acknowledge`` is set, else nothing

Examples: **Publish an event**

.. code-block:: javascript

   session.publish('com.myapp.hello', ['Hello, world!']);

.. code-block:: javascript

   session.publish('com.myapp.hello', [], { text: 'Hello, world' })

Complete Examples:

* `PubSub Basic <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/basic>`_
* `PubSub Complex Payload <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/complex>`_


Acknowledgement
+++++++++++++++

By default, a publish is not acknowledged by the *Broker*, and the *Publisher* receives no feedback whether the publish was indeed successful or not.

If supported by the *Broker*, a *Publisher* may request acknowledgement of a publish via the option ``acknowledge`` set to ``true``.

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

* ``exclude``
* ``eligible``

``exclude`` is an array of WAMP session IDs providing an explicit list of (potential) *Subscribers* that won't receive a published event, even though they might be subscribed. In other words, ``exclude`` is a blacklist of (potential) *Subscribers*.

``eligible`` is an array of WAMP session IDs providing an explicit list of (potential) *Subscribers* that are allowed to receive a published event. In other words, ``eligible`` is a whitelist of (potential) *Subscribers*.

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

If supported by the *Broker*, this behavior can be overridden via the option ``exclude_me`` set to ``false``.

Example: **Publish without excluding publisher**

.. code-block:: javascript

   session.publish('com.myapp.hello', ['Hello, world!'], {}, {exclude_me: false});


Publisher Identification
++++++++++++++++++++++++

If the feature is supported by the *Broker*, a *Publisher* may request the disclosure of its identity (its WAMP session ID) to receivers of a published event via the option ``disclose_me`` set to ``true``.

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

.. js:function:: session.register(procedure, endpoint, options)

   :param URI procedure: the URI of the procedure to register
   :param callable endpoint: the function that provides the procedure implementation
   :param object options: *optional* - specifies options for registration (see below)

   :returns: a *promise* that resolves to an instance of ``autobahn.Registration`` when successful, or rejects with an instance of ``autobahn.Error`` when unsuccessful.

The ``endpoint`` must be a callable

    function (args, kwargs, details)

where

1. ``args`` is an array with call arguments
2. ``kwargs`` is an object with call arguments
3. ``details`` is an object which provides call metadata

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
* `RPC Arguments <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/arguments>`_
* `RPC Complex Result <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/complex>`_
* `RPC Slow Square <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/slowsquare>`_


Active Registrations
++++++++++++++++++++

A list of registrations (in no particular order) currently active on a ``session`` may be accessed like via :js:attr:`Session.registrations`.

This returns an array of ``autobahn.Registration`` objects. E.g.

.. code-block:: javascript

   var regs = session.registrations;
   for (var i = 0; i < regs.length; ++i) {
      console.log("Active registration with ID " + regs[i].id);
   }

.. note:: Caution: This property and the registration objects returned should be considered read-only. DO NOT MODIFY.


Unregistering
+++++++++++++

You can unregister a previously established ``registration``

.. js:function:: session.unregister(registration)

   :param object registration: instance of autobahn.Registration

   :returns: a *promise* that resolves with no value when successful or rejects with an instance of ``autobahn.Error`` when unsuccessful.


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

.. js:function:: session.call(procedure, args, kwargs, options)

   :param URI procedure: the URI of the procedure to call
   :param array args: *optional* - call arguments
   :param object kwargs: *optional* - call arguments
   :param object options: *optional* - options for the call (see below)

   :returns: a *promise* that will resolve to the call result if successful (either a plain value or an instance of ``autobahn.Result``) or reject with an instance of ``autobahn.Error``.

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
* `RPC Complex Result <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/complex>`_
* `RPC Slow Square <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/slowsquare>`_


Errors
++++++

On an error with a PRC call, a error object is passed to the error handler defined in the call. This has three properties:

* error URI
* an array of error arguments
* an object with error arguments

Throwing an error in a registered procedure can happen in one of two ways:

* by defining an array of error arguments
* by creating a ``autobahn.Error`` object

In the first case, the ``error URI`` is set to a default value, and the object of error arguments remains emtpy, i.e. if you do

.. code-block:: javascript

   throw ['this is just an error', 'with an array of arguments'];

logging this in the caller will come out something like

::

   wamp.error.runtime_error ["this is just an error", "with an array of arguments"] Object {}

When defining an ``autobahn.Error` object, all three properties can be defined. I.e. doing

.. code-block:: javascript

   throw new autobahn.Error('com.myapp.error', ['this is a more complex error'], {a: 23, b: 9});

and logging this in the caller will lead to something like

::

   com.myapp.error ['this is a more complex error'] Object {a: 23, b: 9}


Complete Examples:

* `RPC Errors <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/errors>`_


Progressive Results
+++++++++++++++++++

Instead of returning just a single, final result, a remote procedure can return progressive results, if this is requested by the caller.

Progressive results are part of the advanced spec for WAMP, and may not be supported by all WAMP routers.

An example for a call requesting progressive call results would be

.. code-block:: javascript

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

Here a third callback has been added, which is fired on each receipt of a progressive result event.

In the backend, the function for returning progressive results could be something like

.. code-block:: javascript

   if (details.progress) {
      for (var i = 0; i < 5; i++) {
         details.progress(i);
      }
      return "progressive result"
   } else {
      return "single result";
   }

which would return 5 progressive result events (each with the current value of ``i`` as the payload) before returning ``"progressive result"`` as the final result.

Complete Examples:

* `RPC Progress <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/progress>`_
