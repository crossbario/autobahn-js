.. _tutorial_pubsub:


Publish & Subscribe with **Autobahn**\|JS
=========================================

The goal of this tutorial is to introduce publish and subscribe (PubSub) messaging with |ab| .

Publish & Subscribe is a messaging pattern in which publishers send events to a server, and this server distributes the events to subscribers. Publishers and subscribers are decoupled through the server: they don't have any knowledge about each other. The connection between the two is only established via the topics.

Sending and receiving of events are asynchronous.

Publish & Subscribe can be used for a large variety of applications, e.g. chat, news updates, or, with low-latency implementations, distribution of real-time data.

It scales well, and the fact that subscriptions need not be handled by publishers means that publishing is a light-weight process that can easily be added to applications.

In |ab| , PubSub is implemented based on the `Web Application Messaging Protocol (WAMP) <http://wamp.ws/>`_, an open protocol that enables both PubSub and Remote Procedure Calls (RPC) over WebSocket. There is also a :ref:`tutorial for how to do RPC <tutorial_rpc>` using |ab| .

In this tutorial well will create a small JavaScript application that consists of two clients which connect to a WAMP router. Clients can run either in the browser or on Node.js. One of the clients publishes to a topic to which the other client subscribes himself. The sent and received events are logged in the respective browser consoles or command shells.

Download links for all code are provided with the explanations for the respective parts.


Prerequisites
-------------

For this tutorial, you will need

* a `modern Web Browser <http://caniuse.com/#search=websocket>`_ supporting WebSockets to run the clients **or** Node.js
* `Crossbar.io <http://crossbar.io>`_, an open source WAMP application router to provide the RPC routing.


The WAMP router
---------------

The PubSub pattern is about decoupling publishers and subscribers. A publisher has no need to know of subscribers, and a subscriber (usually) does not care who the publisher is. This decoupling is done via the router: Publishers publish on a topic to the router, and subscribers register their interest in a topic with the router.

For this tutorial we use Crossbar.io, an open source application router. (We could also use the basic router functionality which is provided by Autobahn|Python.)

For the installation of Crossbar.io, see the `detailed instructions <https://github.com/crossbario/crossbar/wiki/Getting-Started>`_ at the project GitHub repo.

Once you've installed Crossbar.io, open a command shell, create a test directory, initialize Crossbar.io and start it.

::

   mkdir test1
   cd test 1
   crossbar init
   crossbar start

That's it. Crossbar.io is running, ready to route our PubSub events. (It runs until you break out from the Python interpreter - Ctrl-C/D/Z depending on your platform).

With this we have all the non-JavaScript stuff out of the way. From now on it's Web technologies only.


The HTML
--------

Since we want to be able to run the clients in either the browser or Node.js, we'll keep the the HTML very simple for both the publisher and the subscriber. We basically just want something which identifies the browser tab to us, plus, of course, we need to load the WAMP library, |ab| and our JavaScript.

For the publisher, we use:

.. code-block:: html

   <!DOCTYPE html>
   <head>
      <meta charset="UTF-8">
      <title>AutobahnJS PubSub Publisher</title>
   </head>
   <html>
      <body>
         <h1>AutobahnJS PubSub Publisher</h1>
         <p>Open JavaScript console to watch output.</p>
         <script
            src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz">
         </script>
         <script src="autobahnjs_pubsub_publisher.js"></script>
      </body>
   </html>

and for the subscriber:

.. code-block:: html

   <!DOCTYPE html>
   <head>
      <meta charset="UTF-8">
      <title>AutobahnJS PubSub Subscriber</title>
   </head>
   <html>
      <body>
         <h1>AutobahnJS PubSub Subscriber</h1>
         <p>Open JavaScript console to watch output.</p>
         <script
            src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz">
         </script>
         <script src="autobahnjs_pubsub_subscriber.js"></script>
      </body>
   </html>

Download the HTML (right click + 'save as'):

* :download:`Publisher </_static/autobahnjs_pubsub_publisher.html>`
* :download:`Subscriber </_static/autobahnjs_pubsub_subscriber.html>`


The JavaScript
--------------

Download the JavaScript (right click + 'save as'):

* :download:`Publisher </_static/autobahnjs_pubsub_publisher.js>`
* :download:`Subscriber </_static/autobahnjs_pubsub_subscriber.js>`


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

The first thing we need to do if we want to use PubSub over WebSockets is to establish a WebSocket connection.

|ab| provides some comfort features for handling WebSocket connections. Because of this all our interaction for the connection is via |ab| .

The code to establish a WAMP/WebSocket connection is the same for both the publisher and the subscriber.

.. code-block:: javascript
   :linenos:
   :emphasize-lines: 2, 8, 13

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

  * The WebSockets address to connect to. This starts with the WebSockets protocol prefix 'ws' (instead of 'http' for regular web traffic), and here is the localhost on port 9000. It could equally be the IP of the machine you run the router on.
  * The WAMP realm to connect to. Realms are used to group connections to a WAMP router together, and to e.g. apply permissions to them. With our demo router, we are free to chose a realm name.

* We set up an 'onopen' handler, i.e. a function to execute once a connection has been established (starting at line 8). This is passed an object through which we can interact with the established WAMP/WebSocket session.
* We open the WAMP/WebSocket connection (line 13).

The options dictionary for the connection accepts further optional arguments. For this tutorial, none of these are relevant.


On connect
++++++++++

Once the connection is established, the code in the 'onopen' handler is executed.

For the **publisher** this is:

.. code-block:: javascript
   :linenos:
   :emphasize-lines: 6

   // Start publishing events
   var counter = 0;

   setInterval ( function () {

      session.publish ('com.myapp.topic1', [ counter ], {}, { acknowledge: true}).then(

         function(publication) {
            console.log("published, publication ID is ", publication);
         },

         function(error) {
            console.log("publication error", error);
         }

      );

      counter += 1;

   }, 1000 );

What we do here is:

* The publication of the event itself if just a single line (line 6). The publication is for a topic, 'com.myapp.topic1'. WAMP uses URIs (with the notation following the Java package naming conventions) to identify topics.
* The publication also has an optional payload.
* The payload here is a counter, which we've defined in line 2 and which we increment after each publish (line 18).
* We want to publish more than once, so we create an interval time to wrap the publication (line 4).
* We want feedback that the publication was successful. As a default, publications are not acknowledged by the router. We change this by adding an options dictionary and passing 'acknowledge' as 'true'.
* The publish creates a promise, which is resolved when the acknowledge returns as either successful or failed. We attach a handler for either outcome to the promise (that's the ``.then()``). For more on promises see below.
* The first handler function we attach (starting in line 8) is called on success, i.e. if the publish is received and allowed. It logs the received publication ID for the publish.
* The second handler function (starting in line 12) is called on failure. It logs the received error code.

For the **subscriber** this is:

.. code-block:: javascript
   :linenos:
   :emphasize-lines: 4, 9, 25

   var currentSubscription = null;

   // Define an event handler
   function onEvent(args, kwargs, details) {

      console.log("Event received ", args, kwargs, details);

      if ( args[0] > 20 ) {
         session.unsubscribe(subscription).then(

            function(gone) {
               console.log("unsubscribe successfull");
            },

            function(error) {
               console.log("unsubscribe failed", error);
            }

         );
      }

   }

   // Subscribe to a topic
   session.subscribe('com.myapp.topic1', onEvent).then(

      function(subscription) {
         console.log("subscription successfull", subscription);
         currentSubscription = subscription;
      },

      function(error) {
         console.log("subscription failed", error);
      }

   );

What we do here is:

* We subscribe to a topic (line 25). Arguments are the subscription topic (identified by a URI) and the subscription event handler.
* The subscribe creates a promise, which is resolved when the subscribe either succeeds or fails. We attach a handler for either outcome to the promise (that's the ``.then()``). For more on promises see below.
* The first handler is called when the subscribe succeeds (line 27). It logs the received subscription object. We also store this object, since it is needed to unsubscribe.
* The second handler is called when the subscribe fails (line 32). It logs the received error code.
* We define a handler for subscription events (line 4). This first of all logs the fact that we have received an event plus the event payload.
* The payload is an array and/or a dictionary (sent by the publisher) and publication details (created by the router).
* The subscription event handler also checks the current value of the counter that the publisher sent as the sole content of the array (line 8). Once this exceeds 20, we unsubscribe (line 9), using the previously stored subscription object.
* Just like the subscribe, the unsubscribe creates a promise. We attach two handlers to this (lines 11, 15), which log success or failure.


Using Promises to handle deferred outcomes
------------------------------------------

With all networking events, the outcome of a process involves network latencies. Quite often the connection will be one over the web (we are using WebSockets, after all). With this the accumulated round trip times for actions like publishes and subscriptions will be several orders of magnitude above what they would be if executed towards a local component.

Conventional synchronous programming in JavaScript, in which the program blocks until there is a function result, is not an option if apps are to remain speedy.

To handle this problem, the |ab| library implements a form of promises. This means that together with the publish or subscribe, you pass at least one function to handle the result of the action, e.g.

.. code-block:: javascript

   session.subscribe('com.myapp.topic1', onEvent).then(session.log);

The execution of this function is then deferred until the result has been received (the 'promise' has been fulfilled).

In the above example, only a single function is passed as an argument, which is called when the action is successful. In our demo, we also pass a second function which is executed if the action fails, e.g. if the subscription is not allowed.

There's no need for you to manage anything regarding the passed functions - reception of the result and execution of the function for handling the result, or calling of the error function, are fully automatic in the background. All it may take is a little rethinking of some of the habits from synchronous programming - but you gain an extremely powerful and flexible tool.


Summary & Beyond
----------------

This tutorial gave an overview how simple PubSub messaging is with |ab| - no more than a line of code each for either subscribing and publishing.

We encourage you to play around with the demo app. Run it on different machines. Add more event data. Use the received events to trigger functions that do more than just log things.

The :ref:`examples overview page <examples_overview>` lists available examples which demonstrate additional features of WAMP.

The :ref:`tutorial_rpc` tutorial shows you an equally quick and easy start into remote procedure calls (RPC) with |ab|.
