===============
Getting Started
===============

This guide will help you get up and running with Autobahn|JS.

Prerequisites
-------------

- **Node.js 22+** (for native WebSocket support) or a modern browser
- A WAMP router (e.g., `Crossbar.io <https://crossbar.io/>`_)

Installation
------------

Node.js
^^^^^^^

.. code-block:: bash

   npm install autobahn

Browser
^^^^^^^

Download from `GitHub Releases <https://github.com/crossbario/autobahn-js/releases>`_
or use a CDN:

.. code-block:: html

   <script src="https://cdn.jsdelivr.net/npm/autobahn@latest/autobahn.min.js"></script>

Basic Connection
----------------

.. code-block:: javascript

   const autobahn = require('autobahn');

   const connection = new autobahn.Connection({
       url: 'ws://localhost:8080/ws',
       realm: 'realm1'
   });

   connection.onopen = function (session, details) {
       console.log('Connected to router');
       console.log('Session ID:', session.id);
   };

   connection.onclose = function (reason, details) {
       console.log('Connection closed:', reason);
       return false;  // don't retry
   };

   connection.open();

Connection Options
------------------

.. code-block:: javascript

   const connection = new autobahn.Connection({
       // Required
       url: 'ws://localhost:8080/ws',
       realm: 'realm1',

       // Optional: Authentication
       authmethods: ['wampcra', 'ticket'],
       authid: 'user1',
       onchallenge: function (session, method, extra) {
           if (method === 'ticket') {
               return 'secret-ticket';
           }
       },

       // Optional: Serialization (default: JSON)
       serializers: [
           new autobahn.serializer.MsgpackSerializer(),
           new autobahn.serializer.CBORSerializer(),
           new autobahn.serializer.JSONSerializer(),
       ],

       // Optional: Reconnection
       max_retries: 15,
       initial_retry_delay: 1.5,
       max_retry_delay: 300,
       retry_delay_growth: 1.5,
   });

Remote Procedure Calls (RPC)
----------------------------

Registering a Procedure
^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   session.register('com.example.add2', function (args, kwargs, details) {
       return args[0] + args[1];
   }).then(
       function (registration) {
           console.log('Procedure registered:', registration.id);
       },
       function (error) {
           console.log('Registration failed:', error);
       }
   );

Calling a Procedure
^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   session.call('com.example.add2', [2, 3]).then(
       function (result) {
           console.log('Result:', result);  // 5
       },
       function (error) {
           console.log('Call failed:', error);
       }
   );

Publish/Subscribe (PubSub)
--------------------------

Subscribing to a Topic
^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   session.subscribe('com.example.event', function (args, kwargs, details) {
       console.log('Event received:', args[0]);
   }).then(
       function (subscription) {
           console.log('Subscribed:', subscription.id);
       },
       function (error) {
           console.log('Subscription failed:', error);
       }
   );

Publishing an Event
^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   session.publish('com.example.event', ['Hello, World!'], {}, {
       acknowledge: true  // wait for router acknowledgment
   }).then(
       function () {
           console.log('Event published');
       },
       function (error) {
           console.log('Publish failed:', error);
       }
   );

Next Steps
----------

- See :doc:`examples` for more code examples
- Browse the :doc:`api/index` for detailed API documentation
- Learn about WAMP at `wamp-proto.org <https://wamp-proto.org/>`_
