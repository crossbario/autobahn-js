WebSockets RPC/PubSub for JS
============================

What is that?
-------------

WebSockets <http://tools.ietf.org/html/rfc6455> is built into
modern browsers and provides full-duplex, low-latency
communication.

However, as such, it is quite low-level. Web apps often have
a need for higher level messaging patterns:

   Publish & Subscribe
   Remote Procedure Calls

This is where WAMP enters. WAMP (WebSocket Application Messaging Protocol)
runs on top of raw WebSocket and provides PubSub and RPC.

Technically, WAMP is a proper WebSocket subprotocol that uses JSON as
message serialization format.
