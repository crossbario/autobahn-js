.. _examples_overview:


Overview of Examples
====================

The examples give an overview of the features of WAMP by providing working code.

Read, run, and modify as you like!

.. note:: The JavaScript code provided runs both in the browser and in Node.js. When using the browser, load the JavaScript via the provided HTML page. Each example also contains Python versions. Python and JavaScript versions are interoperable: You may run e.g. a JavaScript subscriber and a Python publisher.


Publish & Subscribe (PubSub)
----------------------------

`Basic <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/basic>`_ - Demonstrates basic publish and subscribe.

`Complex <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/complex>`_ - Demonstrates publish and subscribe with complex events - payload arrays, payload objects and event details objects.

`Options <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/options>`__ - Using publication options with PubSub, such as getting an acknowledgement for a publication.

`Unsubscribe <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/pubsub/unsubscribe>`_ - Cancel a subscription to a topic.



Remote Procedure Calls (RPC)
----------------------------

`Time Service <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/timeservice>`_ - A trivial time service - demonstrates basic remote procedure call feature.


`Slow Square <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/slowsquare>`_ - Demonstrates procedures which return asynchronously and return promise.

`Arguments <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/arguments>`_ - Demonstrates all variants of call arguments (arrays and objects).

`Complex Result <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/complex>`_ - Demonstrates complex call results (call results with more than one positional or keyword results).

`Errors <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/errors>`_ - Demonstrates error raising and catching over remote procedures.

`Progressive Results <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/progress>`_ - Demonstrates calling remote procedures that produce progressive results.

`Options <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic/rpc/options>`_ - Using options with RPC to exclude a RPC caller from a publication.


Running examples
----------------

All examples require a WAMP router.

We suggest using `Crossbar.io <http://crossbar.io>`_, an open source WAMP application router.

For the installation of Crossbar.io, see the `project documentation <http://crossbar.io/docs/Quick-Start/>`_.

Once you've installed Crossbar.io, open a command shell, create a test directory, initialize Crossbar.io and start it.

::

   mkdir test1
   cd test 1
   crossbar init
   crossbar start

Alternatively, you can use the basic WAMP router which is integrated into `Autobahn|Python <https://github.com/tavendo/AutobahnPython>`_.


Code runs both in the browser and in Node.js.

For the latter, you need to have |ab| installed. To do so, in a shell do

::

   npm install autobahn
   npm install when
