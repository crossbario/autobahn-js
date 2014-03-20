.. _tutorial_rpc:

Remote Procedure Calls with **Autobahn**\|JS
============================================

.. |ab| replace:: **Autobahn**\|JS

The goal of this tutorial is to introduce remote procedure calls (RPC) with |ab|.

RPC, as the name suggests, means calling a procedure remotely. The remote procedure endpoint is most usually on a server, but with WAMP, the protocol which |ab| implements, it can also be within a JavaScript client.

The result of the called procedure is received in the call return. Examples of RPCs are a request to a server to send some current weather data when a weather app starts up, or the sending of some form input to be verified on a server.

In |ab|, RPC is implemented based on WAMP, an open protocol that does both RPC and Publish & Subscribe (PubSub) over WebSocket. There's also a tutorial for how to do PubSub using |ab|.

In this tutorial we will create a small web app that consists of two clients which connect to a WAMP router. One of the clients provides an RPC endpoint (the 'backend') while the other calls this procedure and logs its result (the 'frontend'). The WAMP router routes the calls and results.

We will create both the 'frontend' and the 'backend' ready to run in a browser, but the JavaScript can equally be executed in Node.js.

Download links for all code are provided with the explanations for the respective parts.


Prerequisites
-------------

For this tutorial, you will need

* a modern Web Browser with WebSockets to run the clients, and
* `Crossbar.io <http://crossbar.io>`_, a WAMP application router to provide the RPC routing


The WAMP RPC router
-------------------

Browsers can only act as WebSockets clients, so we need something external to the browser to act as a router. For this we use Crossbar.io, an open source application router.

For the installation of Crossbar.io, see the `detailed instructions <https://github.com/crossbario/crossbar/wiki/Getting-Started>`_ at the project GitHub repo.

Once you've installed Crossbar.io, open a command shell, create a test directory, initialize Crossbar.io and start it.

::

   mkdir test1
   cd test 1
   crossbar init
   crossbar start

That's it - Crossbar.io is running, ready to route our RPCs. (It runs until you break out from the Python interpreter - Ctrl-C/D/Z depending on your platform).

With this we have all the non-JavaScript stuff out of the way. From now on it's web technologies only.

The HTML
--------

The HTML is very simple for both the 'frontend' and the 'backend'.

For the 'backend', we want something which identifies the browser tab to us, plus, of course, we need to load the WAMP library, |ab| .

.. code-block:: html

   <!DOCTYPE html>
   <head>
      <meta charset="UTF-8">
      <title>AutobahnJS RPC Backend</title>
   </head>
   <html>
      <body>
         <h1>AutobahnJS RPC Backend</h1>
         <p>Open JavaScript console to watch output.</p>
         <script src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz"></script>
      </body>
   </html>

For the 'frontend', all that changes are the title strings, i.e. "AutobahnJS RPC Backend" is now "AutobahnJS RPC Frontend".

.. code-block:: html
   :emphasize-lines: 4, 8

   <!DOCTYPE html>
   <head>
      <meta charset="UTF-8">
      <title>AutobahnJS RPC Frontend</title>
   </head>
   <html>
      <body>
         <h1>AutobahnJS RPC Frontend</h1>
         <p>Open JavaScript console to watch output.</p>
         <script src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz"></script>
      </body>
   </html>


The JavaScript
--------------

To make the demo quick to run in the browser, the JavaScript is included as an inline script in the frontend and backend client HTML files. Download:

* :download:`Backend <link to download goes here>`
* :download:`Frontend <link to download goes here>`

The JavaScript on its own can, however, also be run in Node.js. In this case, use

* :download:`Backend <link to download goes here>`
* :download:`Frontend <link to download goes here>`

The only difference is that in the browser, |ab| is loaded via a script tag, while in Node.js we need to include it via node's dependency management.

In order to be freely movable, we can add code which covers both use cases:

.. code-block:: javascript

   try {
      var autobahn = require('autobahn');
   } catch (e) {
      // when running in browser, AutobahnJS will
      // be included without a module system
   }


Connecting to the Server
------------------------

The first thing we need to do if we want to use RPC over WebSockets is to establish a WebSocket connection. WebSocket is built into modern browsers, so in principle we could use the built-in API for this.

Establishing the connection itself is quite straight forward, but WebSockets is a low-level protocol. It does not provide any in-built features for Remote Procedure calls. For these we use WAMP.

|ab| not only implements WAMP, but also some comfort features for handling WebSocket connections. Because of this all our interaction for the connection is via |ab| .

The code to establish a WAMP/WebSocket connection is the same for both the frontend and the backend.

.. code-block:: javascript
   :linenos:
   :emphasize-lines: 2, 8, 13

   // Set up WAMP connection to router
   var connection = new autobahn.Connection({
      url: 'ws://localhost:8080/ws',
      realm: 'tutorialrpc'}
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

* We set up an 'onopen' handler, i.e. a function to execute once a connection has been established (starting at line 8). This is passed an object through which we can interact with the established WAMP/WebSocket session.
* We open the WAMP/WebSocket connection (line 13).

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
   * The name of the function to register ('utcnow')
   * The identifier which a caller needs to use for calling the procedure. For this, WAMP uses URIs following the Java package naming convention.
* The registration creates a promise, which is resolved when the registration either succeeds or fails. We attach a handler for either outcome to the promise (that's the '.then()'). For more on promises see below.
* The first function (starting in line 10) is called if the registration succeeds and logs the registration ID that the server has created. (This is need in case of de-registration of the procedure.)
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
* The call creates a promise, which is resolved when the call either succeeds or fails. We attach a handler for either outcome to the promise (that's the '.then()'). For more on promises see below.
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

This gave an overview how simple RPCs are with |ab| - no more than a line of code each

If you're interested, the :ref:`tutorial_pubsub` tutorial shows you an equally quick and easy start into publish & subscribe with |ab|.
