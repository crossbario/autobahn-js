AutobahnJS
==========

  * Asynchronous RPC/PubSub over WebSocket
  * WAMP compatible implementation (see below)
  * MIT License
  * small (12kB minified)


What is that?
-------------

WebSockets <http://tools.ietf.org/html/rfc6455> is already built into
modern browsers and provides full-duplex, low-latency communication.

However, as such, it is quite low-level. Web apps often have a need for
higher level messaging patterns:

  * Publish & Subscribe
  * Remote Procedure Calls

This is where **WAMP** enters. WAMP (The WebSocket Application Messaging Protocol)
runs on top of raw WebSocket and provides *PubSub* and *RPC*.

Technically, **WAMP** is a proper WebSocket *subprotocol* that uses JSON as
message serialization format. **WAMP** was designed to be easy to use and
simple to implement.

**AutobahnJS** implements **WAMP** in JavaScript to be used in browser
based applications.

Read more about **WAMP** under http://wamp.ws


Show me the code!
-----------------

This is how you do publish & subscribe with **AutobahnJS**.

Include **AutobahnJS**

      <script src="http://autobahn.ws/public/autobahn.min.js"></script>

.. connect and subscribe to receive events on a topic

      var sess;

      function onEvent1(topic, event) {
         alert("got event: " + event);
      }

      $(document).ready(function() {
         sess = new ab.Session("ws://localhost:9000", function() {

            sess.prefix("event", "http://example.com/event#");
            sess.subscribe("event:event1", onEvent1);
         });
      });


.. and publish and event to a topic


      sess.publish("event:event1", {a: 23, b: "foobar"});

      ...

      <button onclick="sendMyEvent();">Publish!</button>
