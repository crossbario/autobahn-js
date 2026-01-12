=============
API Reference
=============

This section documents the public API of Autobahn|JS.

.. note::

   Full auto-generated API documentation from JSDoc is planned for a future release.
   This page provides a manual reference for the main classes and functions.

Core Classes
------------

Connection
^^^^^^^^^^

The ``Connection`` class manages the WebSocket connection and WAMP session lifecycle.

**Constructor**

.. code-block:: javascript

   new autobahn.Connection(options)

**Options**

.. list-table::
   :header-rows: 1
   :widths: 20 15 65

   * - Option
     - Type
     - Description
   * - ``url``
     - string
     - WebSocket URL (e.g., ``ws://localhost:8080/ws``)
   * - ``realm``
     - string
     - WAMP realm to join
   * - ``authmethods``
     - array
     - Authentication methods (e.g., ``['wampcra', 'ticket']``)
   * - ``authid``
     - string
     - Authentication ID (username)
   * - ``onchallenge``
     - function
     - Callback for authentication challenges
   * - ``serializers``
     - array
     - Serializers in preference order
   * - ``max_retries``
     - number
     - Maximum reconnection attempts (default: 15)
   * - ``initial_retry_delay``
     - number
     - Initial retry delay in seconds (default: 1.5)
   * - ``max_retry_delay``
     - number
     - Maximum retry delay in seconds (default: 300)
   * - ``retry_delay_growth``
     - number
     - Retry delay multiplier (default: 1.5)

**Properties**

- ``connection.session`` — The current ``Session`` object (or null if not connected)
- ``connection.isOpen`` — Boolean indicating connection state
- ``connection.isRetrying`` — Boolean indicating if reconnection is in progress

**Callbacks**

- ``connection.onopen = function(session, details) { }`` — Called when connected
- ``connection.onclose = function(reason, details) { }`` — Called when disconnected

**Methods**

- ``connection.open()`` — Open the connection
- ``connection.close(reason, message)`` — Close the connection

Session
^^^^^^^

The ``Session`` class provides WAMP RPC and PubSub functionality.

**Properties**

- ``session.id`` — The WAMP session ID
- ``session.realm`` — The realm name
- ``session.isOpen`` — Boolean indicating session state

**RPC Methods**

.. code-block:: javascript

   // Register a procedure
   session.register(procedure, endpoint, options)
       .then(function(registration) { })
       .catch(function(error) { });

   // Call a procedure
   session.call(procedure, args, kwargs, options)
       .then(function(result) { })
       .catch(function(error) { });

   // Unregister a procedure
   registration.unregister()
       .then(function() { });

**PubSub Methods**

.. code-block:: javascript

   // Subscribe to a topic
   session.subscribe(topic, handler, options)
       .then(function(subscription) { })
       .catch(function(error) { });

   // Publish an event
   session.publish(topic, args, kwargs, options)
       .then(function(publication) { })
       .catch(function(error) { });

   // Unsubscribe from a topic
   subscription.unsubscribe()
       .then(function() { });

Serializers
-----------

Autobahn|JS supports multiple serialization formats:

JSONSerializer
^^^^^^^^^^^^^^

.. code-block:: javascript

   new autobahn.serializer.JSONSerializer()

The default serializer. Human-readable, widely supported.

MsgpackSerializer
^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   new autobahn.serializer.MsgpackSerializer()

Binary format, more compact than JSON. Requires ``msgpack5`` package.

CBORSerializer
^^^^^^^^^^^^^^

.. code-block:: javascript

   new autobahn.serializer.CBORSerializer()

Binary format (RFC 8949). Requires ``cbor`` package.

Authentication
--------------

WAMP-CRA Functions
^^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   // Sign a challenge
   autobahn.auth_cra.sign(secret, challenge)

   // Derive a key from password
   autobahn.auth_cra.derive_key(secret, salt, iterations, keylen)

Error Handling
--------------

Error Class
^^^^^^^^^^^

.. code-block:: javascript

   // Throw a WAMP application error
   throw new autobahn.Error(uri, args, kwargs)

   // Error properties
   error.error    // Error URI (e.g., 'wamp.error.no_such_procedure')
   error.args     // Positional arguments
   error.kwargs   // Keyword arguments

Registration and Subscription Objects
-------------------------------------

Registration
^^^^^^^^^^^^

Returned by ``session.register()``.

- ``registration.id`` — Registration ID
- ``registration.procedure`` — Procedure URI
- ``registration.unregister()`` — Unregister the procedure

Subscription
^^^^^^^^^^^^

Returned by ``session.subscribe()``.

- ``subscription.id`` — Subscription ID
- ``subscription.topic`` — Topic URI
- ``subscription.unsubscribe()`` — Unsubscribe from the topic

Publication
^^^^^^^^^^^

Returned by ``session.publish()`` when ``acknowledge: true``.

- ``publication.id`` — Publication ID

Call and Invocation Options
---------------------------

Call Options
^^^^^^^^^^^^

.. code-block:: javascript

   session.call('procedure', [args], {kwargs}, {
       timeout: 10000,           // Call timeout in ms
       receive_progress: true,   // Receive progressive results
       disclose_me: true         // Disclose caller identity
   });

Registration Options
^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   session.register('procedure', handler, {
       match: 'prefix',          // Pattern matching: 'exact', 'prefix', 'wildcard'
       invoke: 'roundrobin'      // Invocation policy: 'single', 'roundrobin', 'random', 'first', 'last'
   });

Subscription Options
^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   session.subscribe('topic', handler, {
       match: 'prefix',          // Pattern matching: 'exact', 'prefix', 'wildcard'
       get_retained: true        // Get retained event on subscribe
   });

Publish Options
^^^^^^^^^^^^^^^

.. code-block:: javascript

   session.publish('topic', [args], {kwargs}, {
       acknowledge: true,        // Wait for broker acknowledgment
       exclude_me: true,         // Don't send to publisher (default: true)
       exclude: [session_id],    // Exclude specific sessions
       eligible: [session_id],   // Only send to specific sessions
       retain: true              // Retain event for late subscribers
   });
