.. _gettingstarted:

Getting Started
===============

With |ab|, you can develop application components in JavaScript, and those components can be hosted inside **browsers**, **Node.js** and **PostgreSQL** (*under development*).

This page explains what you need in order to include |ab| in your projects, and to route your application messages.

WAMP router
-----------

|ab| does not connect application components directly to each other, but enables a connection to a WAMP router. This connects the application components. The routing is rule-based - no application code runs inside the router.

You can find a `list of WAMP v2 compatible routers <http://wamp.ws/implementations/>`_ at the WAMP project site. We recommend using Crossbar.io <https://github.com/crossbario/crossbar>`_, which is offers a lot of features, but the examples here should work with any WAMP router.


Example Code
------------

You can find complete examples for code running in both the browser and Node.js in the `Autobahn|Python Github repository <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic>`_. (The examples are also provided in Python versions.)


Node.js
-------

You can get |ab| for Node.js using the Node Package Manager:

   ``npm install autobahn``

and then, in your code

.. code-block:: javascript

   var autobahn = require('autobahn')

.. note:: On Windows, ignore any potential error messages regarding missing Visual C++ components. |ab| depends on packages which try to build native extensions for higher performance - but that is not strictly necessary for running it.


Browsers
--------

You can get the **latest** pre-built |ab| release from here:

1. `Production (minimized and gzipped) <https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz>`_
2. `Production (only minimized)] <https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.js>`_
3. `Development <https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.js>`_

For **development purposes**, you can include these directly like so

.. code-block:: html

   <!DOCTYPE html>
   <html>
      <body>
         <script
            src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz">
         </script>
         <script>
            console.log("Ok, Autobahn loaded", autobahn.version);
         </script>
      </body>
   </html>


.. note:: We place restrictions on HTTP referrers, so using the above in production would not work in most cases.

For **production use**, please host |ab| yourself.

The **old** |ab|, which supports the deprecated version 1 of WAMP is still available from here:

1. `0.8.2 Production (minimized and gzipped) <http://autobahn.s3.amazonaws.com/js/autobahn.min.jgz>`_
2. `0.8.2 Production (only minimized) <http://autobahn.s3.amazonaws.com/js/autobahn.min.js>`_
3. `0.8.2 Development <http://autobahn.s3.amazonaws.com/js/autobahn.js>`_


AMD and RequireJS
-----------------

If you are using a module system like `RequireJS <http://requirejs.org/>`_, you can use |ab| like so:

.. code-block:: html

   <!DOCTYPE html>
   <html>
   <body>
   <script src="http://requirejs.org/docs/release/2.1.11/minified/require.js"></script>
   <script>
       require.config({
           baseUrl: ".",
           paths: {
               "autobahn":
                  "https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min",
               "when": "https://cdnjs.cloudflare.com/ajax/libs/when/2.7.1/when"
           },
           shim: {
               "autobahn": {
                   deps: ["when"]
               }
           }
       });
       require(["autobahn"], function(autobahn) {
           console.log("Ok, Autobahn loaded", autobahn.version);
       });
   </script>
   </body>
   </html>


Building |ab|
-------------

Instead of using the versions provided for download (browser) or via npm (Node.js), you can also build |ab| from the GitHub repository.

Doing so allows you to use forks of |ab|, e.g. ones which may implement features you desire, but which have not made it into the mainstream version.

It also allows you to hack on |ab| yourself.

To build |ab|, follow :doc:`these instructions <building>`


What now?
---------

Take a look at the :doc:`tutorial`, which takes you step-by-step through a **simple sample application** that introduces RPC and PubSub.

If you want to see some **live Web apps** using |ab|? Take a look at the `Crossbar.io demos <http://crossbar.io/>`_.

