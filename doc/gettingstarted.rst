.. _gettingstarted:

Getting Started
===============

With |ab|, you can develop application components in JavaScript, and those components can be hosted inside **browsers**, **Node.js** and **PostgreSQL** (*under development*).

To provide the communication between the components of your application, you need a WAMP v2 compatible **application router**.

.. note:: The application router is responsible for call and event routing between your application's components. The router itself will not run any application code.

WAMP implementations need to catch up with V2 of WAMP, and currently, the only WAMP v2 compatible routers are `Autobahn|Python <https://github.com/tavendo/AutobahnPython>`_ and `Crossbar.io <https://github.com/crossbario/crossbar>`_

**Crossbar**.io is an integrated server package that can run from configuration files and acts as a generic WAMP router. To get started with **Crossbar**.io, please see the `project GitHub wiki <https://github.com/crossbario/crossbar/wiki/Getting-Started>`_.

Example Code
------------

You can find complete examples for code running in both the browser and Node.js in the `Autobahn|Python Github repository <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic>`_.


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

You can get the **latest** (= WAMPv2 only) prebuilt |ab| release from here:

  1. `Production (minimized and gzipped) <https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz>`_
  2. `Production (only minimized)] <https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.js>`_
  3. `Development <https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.js>`_

and use it in your HTML like so

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


.. note:: You can use the above via direct linking for *development purposes*, but do not hotlink for production. This will not work, since we place restrictions on HTTP referers.

The **old** |ab| for WAMPv1 is still available from here:

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
                  "https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.js",
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
