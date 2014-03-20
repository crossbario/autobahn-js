.. _tutorial_pubsub:


Publish & Subscribe with **Autobahn**\|JS
=========================================

.. |ab| replace:: **Autobahn**\|JS

The goal of this tutorial is to introduce publish and subscribe (PubSub) messaging with |ab| .

Publish & Subscribe is a messaging pattern in which publishers send events to a server, and this server distributes the events to subscribers. Publishers and subscribers are decoupled through the server: they don't have any knowledge about each other. The connection between the two is only established via the topics.

Sending and receiving of events are asynchronous.

Publish & Subscribe can be used for a huge variety of applications, e.g. chat, news updates, or, with low-latency implementations, distribution of real-time data.

It scales well, and the fact that subscriptions need not be handled by publishers means that publishing is a light-weight process that can easily be added to applications.

In |ab| , PubSub is implemented based on the `Web Application Messaging Protocol (WAMP) <http://wamp.ws/>`_, an open protocol that enables both PubSub and Remote Procedure Calls (RPC) over WebSocket. There is also a :ref:`tutorial for how to do RPC <tutorial_rpc>` using |ab| .

In this tutorial well will create a small web app that consists of two clients which connect to a WAMP server. One of the clients publishes to a topic to which the other client subscribes himself. The sent and received events are logged in the respective browser consoles.


Prerequisites
-------------

For this tutorial, you will need

* a modern Web Browser with WebSockets to run the clients, and
* Crossbar.io, a WAMP application router to provide the RPC routing.


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

That's it - Crossbar.io is running, ready to route our PubSub events. (It runs until you break out from the Python interpreter - Ctrl-C/D/Z depending on your platform).

With this we have all the non-JavaScript stuff out of the way. From now on it's web technologies only.


The HTML
--------

The HTML is very simple for both the publisher and the subscriber.

For the publisher, we want something which identifies the browser tab to us, plus, of course, we need to load the WAMP library, |ab| .

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
         <script src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz"></script>
      </body>
   </html>

For the subscriber, all that changes are the title strings, i.e. "AutobahnJS PubSub Publisher" is now "AutobahnJS PubSub Subscriber".

.. code-block:: html
   :emphasize-lines: 4, 8

   <!DOCTYPE html>
   <head>
      <meta charset="UTF-8">
      <title>AutobahnJS PubSub Subscriber</title>
   </head>
   <html>
      <body>
         <h1>AutobahnJS PubSub Subscriber</h1>
         <p>Open JavaScript console to watch output.</p>
         <script src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz"></script>
      </body>
   </html>


The JavaScript
--------------

To make the demo quick to run in the browser, the JavaScript is included as an inline script in the publisher and subscriber client HTML files.

* :download:`Publisher <link to download goes here>`
* :download:`Subscriber <link to download goes here>`

The JavaScript on its own can, however, also be run in Node.js. In this case, use

* :download:`Publisher <link to download goes here>`
* :download:`Subscriber <link to download goes here>`

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

The first thing we need to do if we want to use PubSub over WebSockets is to establish a WebSocket connection. WebSocket is built into modern browsers, so in principle we could use the built-in API for this.

Establishing the connection itself is quite straight forward, but WebSockets is a low-level protocol. It does not provide any in-built features for publish and subscribe. For these we use WAMP.

|ab| not only implements WAMP, but also some comfort features for handling WebSocket connections. Because of this all our interaction for the connection is via |ab| .

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

   * The WebSockets address to connect to. This starts with the WebSockets protocol prefix 'ws' (instead of 'http' for regular web traffic), and here is the localhost on port 9000. It could equally be the IP of the machine you run the server on.
   * The WAMP realm to connect to. Realms are used to group connections to a WAMP server together, and to e.g. apply permissions to them. With our demo server, we are free to chose a realm name.

* We set up an 'onopen' handler, i.e. a function to execute once a connection has been established (starting at line 8). This is passed an object through which we can interact with the established WAMP/WebSocket session.
* We open the WAMP/WebSocket connection (line 13).

The options dictionary for the connection accepts further optional arguments. For this tutorial, none of these are relevant.


On connect
----------

Once the connection is established, the code in the 'onopen' handler is executed.

For the publisher this is:

.. code-block:: javascript
   :linenos:
   :emphasize-lines: 6

   // Start publishing events
   var counter = 0;

   setInterval(function () {
      console.log("publishing to topic 'com.myapp.topic1': " + counter);
      session.publish('com.myapp.topic1', [counter]);
      counter += 1;
   }, 1000);

What we do here is:

* The publication of the event itself if just a single line (line 6). The publication is for a topic, 'com.myapp.topic1'. WAMP uses URIs (with the notation following the Java package naming conventions) to identify topics. * The publication also has an optional payload
* The payload here is a counter, which we've defined in line 2 and which we increment after each publish (line 7).
* We want to publish more than once, so we create an interval time to wrap the publication.
* Since we want some output in the publisher's console, we log the fact that we're publishing as well as the current counter value (line 5).

For the subscriber this is:

.. code-block:: javascript
   :linenos:
   :emphasize-lines: 7

   // Define an event handler
   function onEvent(args) {
      console.log("Event received ", args);
   }

   // Subscribe to a topic
   session.subscribe('com.myapp.topic1', onEvent);

What we do here is:

* We define a handler for subscription events (line 2). Here, this just logs the fact that we have received an event plus the event payload.
* We then subscribe to the topic (line 7). Arguments are the subscription topic (identified by a URI) and the subscription event handler (the function we've just defined).


Summary & Beyond
----------------

This tutorial gave an overview how simple PubSub messaging is with |ab| - no more than a line of code each for either subscribing and publishing.

We encourage you to play around with the demo app. Run it on different machines. Add more event data. Use the received events to trigger functions that do more than just log things.

If you're interested, the :ref:`tutorial_rpc` tutorial shows you an equally quick and easy start into remote procedure calls (RPC) with |ab|.
