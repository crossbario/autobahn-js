.. _index:

|ab| Documentation
======================================
.. _Autobahn: http://autobahn.ws
.. _AutobahnJS: http://autobahn.ws/js
.. _AutobahnPython: **Autobahn**\|Python
.. _WebSocket: http://tools.ietf.org/html/rfc6455
.. _RFC6455: http://tools.ietf.org/html/rfc6455
.. _WAMP: http://wamp.ws/
.. _WAMPv1: http://wamp.ws/spec/wamp1/
.. _WAMPv2: https://github.com/tavendo/WAMP/blob/master/spec/README.md
.. _AutobahnTestsuite: http://autobahn.ws/testsuite

Overview   -   :ref:`Getting Started <gettingstarted>`   -   :ref:`Tutorials <tutorials>`   -    :ref:`Examples <examples_overview>`   -   :ref:`API Reference <reference>` - :ref:`Table of Contents <table_of_contents>`


|ab| is a subproject of `Autobahn`_ and provides an open-source implementation of `The Web Application Messaging Protocol (WAMP) <http://wamp.ws/>`_ .

WAMP runs on top of `WebSocket <http://tools.ietf.org/html/rfc6455>`_ and adds `asynchronous Remote Procedure Calls and Publish & Subscribe <http://wamp.ws/why/>`_.

|ab| runs in the browser as well as in `Node.js <http://nodejs.org/>`_

It is ideal for distributed, multi-client and server applications, such as multi-user database-drive business applications, sensor networks (IoT), instant messaging or MMOGs (massively multi-player online games) .

WAMP enables application architectures with application code distributed freely across processes and devices according to functional aspects. Code can be in run in either the browser or Node.js  - wherever it makes most sense in a specific use case.

Since WAMP implementations exist for mutliple languages, WAMP applications can be polyglott.

.. note:: The materials here are for the current version of |ab|, which implements version 2 of WAMP. For versions of |ab| <= 0.8.2, see the :ref:`legacy documentation <reference_wampv1>`.

Show me some code
-----------------

The following example implements all four roles that |ab| offers

* Publisher
* Subscriber
* Caller (calls a remote procedure)
* Callee (offers a remote procedure)

**The code runs unaltered in the browser or Node.js!**

.. code-block:: javascript

   var connection = new autobahn.Connection({
            url: 'ws://127.0.0.1:9000/',
            realm: 'realm1'
         });

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


Features
--------

* supports WAMP v2, works with any WAMP server
* works both in the browser and Node.js
* provides asynchronous RPC and PubSub messaging patterns
* easy to use Promise-based API
* pluggable promises/deferreds: use `when.js <https://github.com/cujojs/when>`_  (built-in), `jQuery <http://api.jquery.com/category/deferred-object/>`_ , `Dojo <http://dojotoolkit.org/reference-guide/1.7/dojo/Deferred.html>`_ , ECMA Script 6 or others
* no dependencies
* small size (134kB source, 74kB minified, 23kB compressed)
* Open-Source (MIT License)


Where to go from here
---------------------

:ref:`gettingstarted` gives a brief overview of requirements,  how to get |ab|, and where to get an application router which you need to route the application traffic of your JavaScript application.

The :ref:`tutorials` take you step-by-step through simple sample applications that introduce core WAMP functionality and concepts.

The :ref:`examples overview page <examples_overview>` lists code examples covering a broader range of uses cases and advanced WAMP features.

The `Demos <http://crossbar.io/>`_ give the opportunity to play around with some live sample applciations made using |ab| and `Crossbar.io <http://crossbar.io/>`_, an application router which uses WAMP.

The :ref:`reference` provides details for the entire API.


.. note:: The documentation for older versions of |ab|, which implement WAMP v1, can be accessed here. The current version of |ab| no longer supports WAMP v1. WAMP v2 adds a lot of features and some completely new capabilities, so consider upgrading.


Acknowledgements
================

|ab| includes code from the following open-source projects

  * `when.js <https://github.com/cujojs/when>`_
  * `ws: a node.js websocket library <https://github.com/einaros/ws>`_
  * `CryptoJS <http://code.google.com/p/crypto-js/>`_

Special thanks to the 'Coders with an Unhealthy Javascript Obsession <http://cujojs.com/>`_ for creating *when.js - A lightweight Promise and when() implementation, plus other async goodies.*


Contents:

.. toctree::
   :maxdepth: 2
   :hidden:

   gettingstarted
   tutorial
   examples_overview
   building
   reference
   table_of_contents


Indices and tables
==================

* :ref:`genindex`
* :ref:`search`

