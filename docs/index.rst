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

   .. grid-item-card:: Programming Guide
      :link: programming
      :link-type: doc

      Introduction to using Autobahn|JS in your applications

   .. grid-item-card:: API Reference
      :link: reference
      :link-type: doc

      Complete JavaScript API documentation

   .. grid-item-card:: Examples
      :link: examples
      :link-type: doc

      Overview of available code examples

Installation
------------

**npm (Node.js)**

.. code-block:: bash

   npm install autobahn

**Browser (CDN)**

.. code-block:: html

   <script src="https://cdn.jsdelivr.net/npm/autobahn@latest/autobahn.min.js"></script>

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
   :caption: User Guide
   :hidden:

   getting-started
   programming
   reference
   examples

.. toctree::
   :maxdepth: 2
   :caption: Development
   :hidden:

   building
   release-process
   utils
   changelog
   api/index

.. toctree::
   :maxdepth: 1
   :caption: Links
   :hidden:

   GitHub <https://github.com/crossbario/autobahn-js>
   npm <https://www.npmjs.com/package/autobahn>
   WAMP Protocol <https://wamp-proto.org/>
   Crossbar.io <https://crossbar.io/>
