.. autobahn-js documentation master file

======================================
Autobahn|JS Documentation
======================================

|AbL| is a JavaScript library for `WAMP <https://wamp-proto.org/>`_ (Web Application Messaging Protocol),
providing **Remote Procedure Calls (RPC)** and **Publish/Subscribe (PubSub)** over WebSocket.

.. grid:: 2
   :gutter: 3

   .. grid-item-card:: Getting Started
      :link: getting-started
      :link-type: doc

      Quick introduction to installing and using Autobahn|JS

   .. grid-item-card:: API Reference
      :link: api/index
      :link-type: doc

      Complete JavaScript API documentation

   .. grid-item-card:: Examples
      :link: examples
      :link-type: doc

      Code examples for common use cases

   .. grid-item-card:: WAMP Protocol
      :link: https://wamp-proto.org/

      Learn about the WAMP protocol specification

Installation
------------

**npm (Node.js)**

.. code-block:: bash

   npm install autobahn

**Browser (CDN)**

.. code-block:: html

   <script src="https://cdn.jsdelivr.net/npm/autobahn@latest/autobahn.min.js"></script>

Quick Example
-------------

.. code-block:: javascript

   const autobahn = require('autobahn');

   const connection = new autobahn.Connection({
       url: 'ws://localhost:8080/ws',
       realm: 'realm1'
   });

   connection.onopen = function (session) {
       // Subscribe to a topic
       session.subscribe('com.example.event', function (args) {
           console.log('Event received:', args[0]);
       });

       // Call a remote procedure
       session.call('com.example.add2', [2, 3]).then(function (result) {
           console.log('Result:', result);
       });

       // Register a procedure
       session.register('com.example.multiply', function (args) {
           return args[0] * args[1];
       });

       // Publish an event
       session.publish('com.example.event', ['Hello, WAMP!']);
   };

   connection.open();

Platform Support
----------------

- **Node.js 22+** (uses native WebSocket)
- **Modern browsers**: Chrome, Firefox, Edge, Safari (current versions)

Packages
--------

.. list-table::
   :header-rows: 1
   :widths: 20 15 65

   * - Package
     - License
     - Description
   * - `autobahn <https://www.npmjs.com/package/autobahn>`_
     - MIT
     - Core WAMP client library
   * - `autobahn-xbr <https://www.npmjs.com/package/autobahn-xbr>`_
     - Apache 2.0
     - XBR data market extension

.. toctree::
   :maxdepth: 2
   :caption: Contents
   :hidden:

   getting-started
   api/index
   examples
   changelog

.. toctree::
   :maxdepth: 1
   :caption: Links
   :hidden:

   GitHub <https://github.com/crossbario/autobahn-js>
   npm <https://www.npmjs.com/package/autobahn>
   WAMP Protocol <https://wamp-proto.org/>
   Crossbar.io <https://crossbar.io/>
