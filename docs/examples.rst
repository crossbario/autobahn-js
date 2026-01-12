========
Examples
========

This page contains code examples for common Autobahn|JS use cases.

Error Handling
--------------

.. code-block:: javascript

   session.call('com.example.divide', [10, 0]).then(
       function (result) {
           console.log('Result:', result);
       },
       function (error) {
           console.log('Error URI:', error.error);
           console.log('Error args:', error.args);
           console.log('Error kwargs:', error.kwargs);
       }
   );

Raising Errors from Procedures
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   session.register('com.example.divide', function (args) {
       if (args[1] === 0) {
           throw new autobahn.Error('com.example.error.division_by_zero',
               ['Cannot divide by zero'],
               { dividend: args[0] }
           );
       }
       return args[0] / args[1];
   });

Progressive Call Results
------------------------

For long-running operations that return intermediate results:

.. code-block:: javascript

   // Caller - receiving progressive results
   session.call('com.example.longop', [100], {}, {
       receive_progress: true
   }).then(
       function (result) {
           console.log('Final result:', result);
       },
       function (error) {
           console.log('Error:', error);
       },
       function (progress) {
           console.log('Progress:', progress);
       }
   );

   // Callee - sending progressive results
   session.register('com.example.longop', function (args, kwargs, details) {
       const total = args[0];
       for (let i = 0; i < total; i++) {
           if (details.progress) {
               details.progress([i, total]);
           }
       }
       return 'completed';
   }, { invoke: 'roundrobin' });

Pattern-Based Subscriptions
---------------------------

Prefix Matching
^^^^^^^^^^^^^^^

.. code-block:: javascript

   session.subscribe('com.example', function (args, kwargs, details) {
       console.log('Topic:', details.topic);
       console.log('Data:', args);
   }, { match: 'prefix' });

   // Will receive events published to:
   // - com.example
   // - com.example.foo
   // - com.example.bar.baz

Wildcard Matching
^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   session.subscribe('com..event', function (args, kwargs, details) {
       console.log('Topic:', details.topic);
   }, { match: 'wildcard' });

   // Will receive events published to:
   // - com.foo.event
   // - com.bar.event
   // - com.anything.event

Pattern-Based Registrations
---------------------------

.. code-block:: javascript

   session.register('com.example', function (args, kwargs, details) {
       console.log('Procedure called:', details.procedure);
       return { handled_by: 'wildcard_handler' };
   }, { match: 'prefix' });

   // Will handle calls to:
   // - com.example
   // - com.example.foo
   // - com.example.bar.baz

Subscriber Black/White Listing
------------------------------

.. code-block:: javascript

   // Exclude specific sessions from receiving the event
   session.publish('com.example.event', ['data'], {}, {
       exclude: [session1_id, session2_id]
   });

   // Only send to specific sessions
   session.publish('com.example.event', ['data'], {}, {
       eligible: [session3_id, session4_id]
   });

   // Exclude the publisher (default behavior can be changed)
   session.publish('com.example.event', ['data'], {}, {
       exclude_me: false  // publisher will also receive the event
   });

Authentication
--------------

WAMP-CRA (Challenge-Response)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   const connection = new autobahn.Connection({
       url: 'ws://localhost:8080/ws',
       realm: 'realm1',
       authmethods: ['wampcra'],
       authid: 'user1',
       onchallenge: function (session, method, extra) {
           if (method === 'wampcra') {
               return autobahn.auth_cra.sign('secret123', extra.challenge);
           }
       }
   });

Ticket Authentication
^^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   const connection = new autobahn.Connection({
       url: 'ws://localhost:8080/ws',
       realm: 'realm1',
       authmethods: ['ticket'],
       authid: 'user1',
       onchallenge: function (session, method, extra) {
           if (method === 'ticket') {
               return 'my-secret-ticket';
           }
       }
   });

Binary Serialization
--------------------

For better performance with binary data:

.. code-block:: javascript

   const connection = new autobahn.Connection({
       url: 'ws://localhost:8080/ws',
       realm: 'realm1',
       serializers: [
           new autobahn.serializer.CBORSerializer(),
           new autobahn.serializer.MsgpackSerializer(),
           new autobahn.serializer.JSONSerializer(),
       ]
   });

RawSocket Transport
-------------------

For higher performance in Node.js:

.. code-block:: javascript

   const connection = new autobahn.Connection({
       url: 'rs://localhost:8081/',  // RawSocket URL
       realm: 'realm1'
   });

Browser Usage
-------------

.. code-block:: html

   <!DOCTYPE html>
   <html>
   <head>
       <script src="autobahn.min.js"></script>
   </head>
   <body>
       <script>
           var connection = new autobahn.Connection({
               url: 'ws://localhost:8080/ws',
               realm: 'realm1'
           });

           connection.onopen = function (session) {
               console.log('Connected!');

               session.subscribe('com.example.event', function (args) {
                   document.body.innerHTML += '<p>' + args[0] + '</p>';
               });
           };

           connection.open();
       </script>
   </body>
   </html>
