AutobahnJS
==========

  * Asynchronous RPC/PubSub over WebSocket
  * WAMP compatible implementation (see http://wamp.ws)
  * no dependencies
  * tiny size (47kB, 13kB minified, 5kB compressed)
  * MIT License


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

Read more about **WAMP** and other **WAMP** compatible implementations
on http://wamp.ws


Show me the code!
-----------------

This is how you do publish & subscribe with **AutobahnJS**.

Include **AutobahnJS**

      <script src="http://autobahn.ws/public/autobahn.min.js"></script>

.. connect and subscribe to receive events on a topic

      var sess;

      window.onload = function() {
         sess = new ab.Session("ws://localhost:9000", function() {

            sess.subscribe("http://example.com/event#event1", onEvent1);
         });
      };

      function onEvent1(topic, event) {
         alert("got event: " + event);
      }


.. and publish an event to a topic


      function publishEvent1() {

         sess.publish("http://example.com/event#event1", {a: 23, b: "foobar"});
      };

      ...

      <button onclick="publishEvent1();">Publish!</button>


You can find a complete app template including proper error handling here

   http://localhost:8080/developers/autobahnjs/reference#apptemplate


More Information
----------------

For more information, including tutorials and reference, please visit:

   http://autobahn.ws/developers/autobahnjs


Contact
-------

Get in touch on IRC #autobahn on chat.freenode.net or join the mailing
list on http://groups.google.com/group/autobahnws.
