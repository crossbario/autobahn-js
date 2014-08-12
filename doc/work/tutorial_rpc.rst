.. _tutorial_rpc:

Remote Procedure Calls with **Autobahn**\|JS
============================================

The goal of this tutorial is to introduce remote procedure calls (RPC) with |ab|.

RPC, as the name suggests, means calling a procedure remotely. The remote procedure endpoint is most usually on a server, but with `WAMP <http://wamp.ws/>`_, the protocol which |ab| implements and which implements RPCs, it can also be within a JavaScript client.

The result of the called procedure is received in the call return. Examples of RPCs are a request to a server to send some current weather data when a weather app starts up, or the sending of some form input to be verified on a server.

WAMP, the 'Web Application Messaging Protocol', is an open protocol that does both RPC and Publish & Subscribe (PubSub), as a default via WebSocket. There's also a :ref:`tutorial for how to do PubSub <tutorial_pubsub>` using |ab|.

In this tutorial we will create a small web app that consists of two clients which connect to a WAMP router. Clients can run either in the browser or on Node.js. One of the clients provides an RPC endpoint (the 'callee') while the other calls this procedure and logs its result (the 'caller'). The WAMP router routes the calls and results. The calls and received results are logged in the respective browser consoles or command shells.

Download links for all code are provided with the explanations for the respective parts.


Prerequisites
-------------

For this tutorial, you will need

* a `modern Web Browser <http://caniuse.com/#search=websocket>`_ with WebSockets to run the clients **or** Node.js
* `Crossbar.io <http://crossbar.io>`_, an open source WAMP application router to provide the RPC routing


The WAMP RPC router
-------------------

Callers should not have to know about callees. With a single callee providing an endpoint for a procedure, this is clean design. With more advanced deployments, e.g. load-balancing across several callees, it becomes essential. The decoupling is achieved via a WAMP router. Callees register with the router, and it then routes calls by callers to the callee(s).

For this tutorial we use Crossbar.io, an open source application router. (We could also use the basic router functionality which is provided by Autobahn|Python.)

For the installation of Crossbar.io, see the `detailed instructions <https://github.com/crossbario/crossbar/wiki/Getting-Started>`_ at the project GitHub repo.

Once you've installed Crossbar.io, open a command shell, create a test directory, initialize Crossbar.io and start it.

::

   mkdir test1
   cd test 1
   crossbar init
   crossbar start

That's it - Crossbar.io is running, ready to route our RPCs. (It runs until you break out from the Python interpreter - Ctrl-C/D/Z depending on your platform).

With this we have all the non-JavaScript stuff out of the way. From now on it's Web technologies only.

The HTML
--------

Since we want to be able to run the clients in either the browser or Node.js, we'll keep the the HTML very simple for both the caller and the callee. We basically just want something which identifies the browser tab to us, plus, of course, we need to load the WAMP library, |ab| and our JavaScript.

.. code-block:: html

   <!DOCTYPE html>
   <head>
      <meta charset="UTF-8">
      <title>AutobahnJS RPC Callee</title>
   </head>
   <html>
      <body>
         <h1>AutobahnJS RPC Callee</h1>
         <p>Open JavaScript console to watch output.</p>
         <script
            src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz">
         </script>
         <script src="autobahnjs_rpc_callee.js"></script>
      </body>
   </html>

and for the caller:

.. code-block:: html

   <!DOCTYPE html>
   <head>
      <meta charset="UTF-8">
      <title>AutobahnJS RPC Caller</title>
   </head>
   <html>
      <body>
         <h1>AutobahnJS RPC Caller</h1>
         <p>Open JavaScript console to watch output.</p>
         <script
            src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz">
         </script>
         <script src="autobahnjs_rpc_caller.js"></script>
      </body>
   </html>

Download the HTML (right click + 'save as'):

* :download:`Callee </_static/autobahnjs_rpc_callee.html>`
* :download:`Caller </_static/autobahnjs_rpc_caller.html>`


The JavaScript
--------------

Download the JavaScript (right click + 'save as'):

* :download:`Callee </_static/autobahnjs_rpc_callee.js>`
* :download:`Caller </_static/autobahnjs_rpc_caller.js>`


Running in the browser vs. Node.js
++++++++++++++++++++++++++++++++++

The only difference between running the JavaScript for our demo application in the browser and in Node.js is that in the browser, |ab| is loaded via a script tag, while in Node.js we need to include it via Node's dependency management.

In order for the same JavaScript to run in both cases, we do:

.. code-block:: javascript

   try {
      var autobahn = require('autobahn');
   } catch (e) {
      // when running in browser, AutobahnJS will
      // be included without a module system
   }

You need to have |ab| installed for Node.js. To do so, in a shell do

::

   npm install autobahn
   npm install when


Connecting to the Server
++++++++++++++++++++++++

The first thing we need to do if we want to use RPC over WebSockets is to establish a WebSocket connection.

|ab| provides some comfort features for handling WebSocket connections. Because of this all our interaction for the connection is via |ab| .

The code to establish a WAMP/WebSocket connection is the same for both the publisher and the subscriber.

.. code-block:: javascript
   :linenos:
   :emphasize-lines: 2, 10, 17

   // Set up WAMP connection to router
   var connection = new autobahn.Connection({

      url: 'ws://localhost:8080/ws',
      realm: 'tutorialpubsub'}

   );

   // Set up 'onopen' handler
   connection.onopen = function (session) {

      // code to execute on connection open goes here

   };

   // Open connection
   connection.open();

What we do here is:

* We define (line 2) a WAMP/WebSocket connection with the minimum amount of necessary parameters

  * The WebSockets address to connect to. This starts with the WebSockets protocol prefix 'ws' (instead of 'http' for regular web traffic), and here is the localhost on port 9000. It could equally be the IP of the machine you run the server on.
  * The WAMP realm to connect to. Realms are used to group connections to a WAMP server together, and to e.g. apply permissions to them. With our demo server, we are free to chose a realm name.

* We set up an 'onopen' handler, i.e. a function to execute once a connection has been established (starting at line 10). This is passed an object through which we can interact with the established WAMP/WebSocket session.
* We open the WAMP/WebSocket connection (line 17).

The options dictionary for the connection accepts further optional arguments. For this tutorial, none of these are relevant.


On connect
----------

Once the connection is established, the code in the 'onopen' handler is executed.

For the backend this is:

.. code-block:: javascript
   :linenos:
   :emphasize-lines: 2, 9, 10, 13

   // Define the remote procedure
   function utcnow() {
      console.log("Someone is calling me;)");
      now = new Date();
      return now.toISOString();
   }

   // Register the remote procedure with the router
   session.register('com.timeservice.now', utcnow).then(
      function (registration) {
         console.log("Procedure registered:", registration.id);
      },
      function (error) {
         console.log("Registration failed:", error);
      }
   );

What we do here is:

* We define the function to be executed as a remote procedure (starting line 2). This simply logs the fact that it has been called to the console, and returns the current time in ISO format.
* We register this function as a remote procedure with the WAMP router we're connected to (line 9). The registration itself has two arguments:

  * The name of the function to register (``utcnow``)
  * The identifier which a caller needs to use for calling the procedure. For this, WAMP uses URIs following the Java package naming convention.

* The registration creates a promise, which is resolved when the registration either succeeds or fails. We attach a handler for either outcome to the promise (that's the ``.then()``). For more on promises see below.
* The first function (starting in line 10) is called if the registration succeeds and logs the registration ID that the server has created. In case we want to de-register the procedure later, we'd need to store the registration object here.
* The second function (starting in line 13) is called if the registration fails and just logs the received error code.

For the frontend this is:

.. code-block:: javascript
   :linenos:
   :emphasize-lines: 2, 4, 8

   setInterval(function() {
      session.call('com.timeservice.now').then(
         // RPC success callback
         function (now) {
            console.log("Current time:", now);
         },
         // RPC error callback
         function (error) {
            console.log("Call failed:", error);
         }
      );
   }, 1000);

What we do here is:

* We want to call the timeservice remote procedure once per second, so we wrap the actual call in an interval timer.
* The call to the remote procedure occurs in line 2. All we need here is the identifier of the procedure. With a procedure which requires input, there would additionally be call arguments. For possible call argument types, see the reference.
* The call creates a promise, which is resolved when the call either succeeds or fails. We attach a handler for either outcome to the promise (that's the ``.then()``). For more on promises see below.
* The first function (starting in line 4) is called if the call succeeds and logs the ISO time string that the procedure has returned.
* The second function (starting in line 8) is called if the call fails and just logs the received error code.


Using Promises to handle deferred outcomes
------------------------------------------

With all networking events, the outcome of a process involves network latencies. Quite often the connection will be one over the web (we are using WebSockets, after all). With this, for simple functions (like our RPC procedure), the accumulated round trip times will be several orders of magnitude above that for a locally executed one.

Conventional synchronous programming in JavaScript, in which the program blocks until there is a function result, is not an option if apps are to remain speedy.

To handle this problem, the |ab| library implements a form of promises. This means that together with the RPC, you pass at least one function to handle the result of the RPC, e.g.

::

   sess.call('com.timeservice.now').then(console.log);

This is what the argument of the ``.then()`` after the RPC is. The execution of this function is then deferred until the result has been received (the 'promise' has been fulfilled).

In the above example, only a single function is passed as an argument, and this is called when the RPC is successful (i.e. returns a result - this result itself can be an error message of the called procedure). In our demo, we also pass a second function which is executed if the RPC itself fails, e.g. if it could not be sent.

There's no need for you to manage anything regarding the passed functions - reception of the result and execution of the function for handling the result, or calling of the error function, are fully automatic in the background. All it may take is a little rethinking of some of the habits from synchronous programming - but you gain an extremely powerful and flexible tool.

Using promises, we can do things like:

.. code-block:: javascript

   // call a function and call another function on success
   sess.call('com.timeservice.now').then(function(res) {
      sess.call('com.formatstrings.date', res).then(console.log);
   });

Here a second RPC is made once the result of the first one is received, and this first result is passed as an argument. The result of this second RPC is then logged.

This is actually somewhat easier than the reverse chaining of functions that conventional JavaScript would demand, where the last executed function is the outermost, with all previous ones nested successively backwards inside.


Summary & Beyond
----------------

This gave an overview how simple RPCs are with |ab| - no more than a line of code each.

We encourage you to play around with the demo app. Run it on different machines. Add more complex (and useful) remote procedures. Use the received results in functions that do more than just log things.

The :ref:`examples overview page <examples_overview>` lists available examples which demonstrate additional features of WAMP.

If you're interested, the :ref:`tutorial_pubsub` tutorial shows you can equally quick and easy start into publish & subscribe with |ab|.
