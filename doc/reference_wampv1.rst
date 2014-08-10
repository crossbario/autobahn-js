.. _reference_wampv1:


Autobahn Legacy (WAMP v1) documentation
=======================================

This page contains materials concerning |ab| 0.8.2, the last version of |ab| to implement version 1 of WAMP.

This version is now in maintenance mode.

Be aware that the following materials are no longer updated.

Downloads
---------

1. `Production (minimized and gzipped) <http://autobahn.s3.amazonaws.com/js/autobahn.min.jgz>`_
2. `Production (only minimized) <http://autobahn.s3.amazonaws.com/js/autobahn.min.js>`_
3. `Development <http://autobahn.s3.amazonaws.com/js/autobahn.js>`_

.. note:: You can use the above via direct linking for *development purposes*, but do not hotlink for production. This will not work, since we place restrictions on HTTP referrers.

In addition, the source code is still accessible in the `project GitHub repository <https://github.com/tavendo/AutobahnJS/tree/wamp1>`_.


Example code
------------

Example code for various aspects of the use of |ab| can be found in the `Autobahn|Python GitHub repository <https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp1>`_


API Reference
-------------

The following is a complete reference of the public application programming interface of AutobahnJS (which supplies WAMP functionality and wraps WebSocket).

Anything not listed here should be considered library internal and not be used from user applications

.. _deferreds-and-promises:

Deferreds and Promises
**********************

.. note:: For the purposes of this document, the terms Promise, Deferred and Future are used synonymous.

AutobahnJS relies on *Promises* for asynchronous programming. For example, when you issue an RPC, the immediate return value you will get back is a Promise object.

.. centered:: **A promise is an object that represents the eventual value returned from the completion of an asynchronous operation (such as a RPC).**

A promise has the following characteristics:

#. Can be in one of three states: unfulfilled, resolved, rejected
#. May only change from unfulfilled to resolved or unfulfilled to rejected
#. Implements a then() method for registering callbacks for notification of state change
#. Callbacks cannot change the value produced by the promise
#. A promise's then() method returns a new promise, to provide chaining while keeping the original promise's value unchanged

Source: [*]

With JavaScript, promises are not built into the language, but come with libraries. There are different implementations. AutobahnJS comes with **when.js** promises built in, but allows to :ref:`plug in <pluggable-promises>` a different promise implementation when needed.

**when.js** is a well tested and maintained JavaScript *promise* implementation conforming to the upcoming `Common JS Promises/A proposal <http://wiki.commonjs.org/wiki/Promises/A>`_ . We expect the **when.js promises** used (per default) by AutobahnJS to be interchangable and interoperable with other implementations conforming to *Common JS Promises/A* .

Details about how to change the promises module to be used are given in the :ref:`pluggable-promises` section below.

Resources

* `Promise (Wikipedia) <http://en.wikipedia.org/wiki/Promise_%28programming%29>`_
* [*] `Dojo Deferreds and Promises <http://dojotoolkit.org/documentation/tutorials/1.6/promises/>`_
* `Getting started with Deferreds (Dojo Documentation) <http://dojotoolkit.org/documentation/tutorials/1.6/deferreds/>`_
* `Dojo Deferreds Reference <http://dojotoolkit.org/reference-guide/1.7/dojo/Deferred.html>`_
* `jQuery Deferred Object <http://api.jquery.com/category/deferred-object/>`_
* `JavaScript Promises/A <http://wiki.commonjs.org/wiki/Promises/A>`_
* `when.js - A lightweight Promise and when() implementation <https://github.com/cujojs/when>`_



Session Lifecycle
*****************

AutobahnJS provides different methods of session establishment - from low-level to high-level:

* `ab.Session`
   Create a raw WAMP session object.
* `ab.connect`
   WAMP session establishment with automatic reconnect.
* `ab.launch`
   WAMP session establishment with automatic reconnect and authentication (WAMP-CRA).


ab.session
++++++++++

Creates a new WAMP session object

.. js:function:: ab.Session(wsuri, onopen, onclose, options)

   :param string wsuri: WebSocket URI of WAMP server.
   :param function onopen: Callback fired when session has been estanlished.
   :param function onclose: Callback fired when session has been closed, lost or failed to be established in the first place.
   :param object options: WAMP session options.

   :returns: (*object*) new session object

ab.connect
++++++++++

Connect to WAMP server, establishing new session. High level function with auto-reconnect.

.. js:function:: ab.connect(wsuri, onconnect, onhangup, options)

   :param string wsuri: WebSocket URI of WAMP server.
   :param function onconnect: Callback fired when session has been established.
   :param function onhangup: Callback fired when session has been closed, lost or failed to be established in the first place.
   :param object options: WAMP session options.

.. code-block:: javascript

   ab.connect(
      // The WebSocket URI of the WAMP server
      wsuri,

      // The onconnect handler
      function (session) {
         // WAMP session established here ..
      },

      // The onhangup handler
      function (code, reason, detail) {
         // WAMP session closed here ..
      },

      // The session options
      {
         'maxRetries': 60,
         'retryDelay': 2000
      }
   );

* The **'onhangup'** handler is optional. If no handler is given, then the code and the reason are logged to the browser console.
* The **'onhangup'** handler is fired both in case of a failure to initially establish a connection, and should the established connection fail.
* Possible **'options'** are

   * **'maxRetries'**: The number of attempts that AutobahnJS makes at (re)establishing a connection.
   * **'retryDelay'**: The time in milliseconds between retries.
   * **'skipSubprotocolCheck'**: boolean, if 'true' the subprotocol check for whether the server speaks WAMP is skipped. May be useful with some browsers which do not provide subprotocol information.
   * **'skipSubprotocolAnnounce'**: boolean, if 'true' the subprotocol announcement (for WAMP) is skipped. May be useful when trying to connect to servers which do not handle WebSocket subprotocols handshaking.


ab.launch
+++++++++

Connect to WAMP server, establishing new session. High level function with auto-reconnect and authentication.

.. js:function:: ab.launch ( appconfig, onconnect, onhangup )

   :param object appconfig: WAMP app configuration.
   :param function onconnect: Callback fired when session has been established.
   :param function onhangup: Callback fired when session has been closed, lost or failed to be established in the first place.

.. code-block:: javascript

   ab.launch(
      // WAMP app configuration
      {
         // Tavendo WebMQ server URL
         wsuri: ab.getServerUrl(),
         // authentication info
         appkey: null, // authenticate as anonymous
         appsecret: null,
         appextra: null,
         // additional session configuration
         sessionConfig: {maxRetries: 10,
                         sessionIdent: "Vote"}
      },
      // session open handler
      function (newSession) {
         sess = newSession;
         main(sess);
      },
      // session close handler
      function (code, reason, detail) {
         sess = null;
      }
   );

session.sessionid
+++++++++++++++++

Return the WAMP session ID of for this session.

.. js:function:: wampSession.sessionid ( )

   :returns: (*string*) - The ID of this session or null if session is not open.


.. code-block:: javascript

   var mySessionId = wampSession.sessionid();

The session ID is used for sending published events to specific recipients, or to exclude recipients from receiving an event.



session.close
+++++++++++++

Close the session.

.. js:function:: wampSession.close ( )

.. code-block:: javascript

   sess.close();


Session Authentication
**********************

Describe WAMP-CRA (WAMP Challenge Response Authentication).


session.authreq
+++++++++++++++

Issues an authentication request.

.. js:function:: wampSession.authreq ( authkey, extra )

   :param string authkey: Authentication key, i.e. user or application name. If undefined, anonymous authentication is performed.
   :param object extra: Authentication extra information - optional.


   :returns: (*deferred object*) A deferred, the success handler of which will be fired with an authentication challenge.


Below are two full examples of an authentication handshake: one for authentication as anonymous, one using an authentication key and secret.

.. code-block:: javascript

   // Authenticate as anonymous

   sess.authreq().then(function () {
      sess.auth().then(function(permissions) {
         // do your stuff
      }, onAuthError);
   }, autreqError);


.. code-block:: javascript

   // Authenticate using authkey and authsecret

   sess.authreq(authkey).then(
      function (challenge) {
         var signature = sess.authsign(challenge, authsecret);
         sess.auth(signature).then(function(permissions){
            // do your stuff
         }, onAuthError);
      }, autreqError);

**'Extra'** is a dictionary. The functions that the **'extra'** serves are up to the implementation. Data in the **'extra'** can e.g. be used to define a role for the user.


session.authsign
++++++++++++++++

Signs an authentication challenge.

.. js:function:: wampSession.authsign ( challenge, secret )

   :param string challenge: Authentication challenge as returned by the WAMP server upon a authentication request.
   :param string secret: Authentication secret.

   :returns: (*string*) Authentication signature. This is then given to wampSession.auth to finish the authentication handshake.


.. code-block:: javascript

   var signature = sess.authsign(challenge, authsecret);

Signing of the challenge may be using the cleartext password, as shown above.

When the server stores the password hashed and salted, WAMP offers a function to derive the secret as stored on the server, and sign using this.
In these cases the challenge string contains the salt the server used.

.. code-block:: javascript

   var secret = ab.deriveKey(authsecret, JSON.parse(challenge).authextra);

   var signature = sess.authsign(challenge, secret);

Signing may also be via a third party, e.g. the Web server that the application is served from and to which it already is authenticated.

This could use something like this example function for the signing request:

.. code-block:: javascript

   function authsignremote(url, challenge) {

      var res = new XMLHttpRequest();
      res.open('POST', url, false);
      res.send(challenge);

      if (res.status == 200) {
         try {
            var r = res.responseText;
            console.log(r);
            return r;
         } catch (e) {
            return null;
         }
      } else {
         return null;
      }
   };

and the signature would then be created like

.. code-block:: javascript

   var signature = authsignremote("/authsign", challenge);



session.auth
++++++++++++

Authenticate, finishing the authentication handshake.

.. js:function:: wampSession.auth ( signature )

   :param string signature: A authentication signature.

   :returns: (*deferred object*) A deferred, the success handler of which will be fired with the granted permissions.


.. code-block:: javascript

   sess.auth(response).then(function(permissions){
      // do your stuff
   }, onAuthError);



Publish and Subscribe
*********************


session.subscribe
+++++++++++++++++

Subscribe to a given topic, subsequently receive events published under the topic.

.. js:function:: wampSession.subscribe(topic, callback)

   :param string topic: An URI or CURIE of the topic to subscribe to.
   :param function callback: The event handler to fire when receiving an event under the subscribed topic.


.. code-block:: javascript

   sess.subscribe("http://example.com/event#myevent1", function (topic, event) {
      console.log("Event 1 received!");
   });

Notes

* The method runs asynchronously and does not provide feedback whether a subscription was successful or not.
* A subscription may fail for example, when the WAMP server employs topic-based authorization and the client is not authorized to access or subscribe to the respective topic.
* The topic can be specified either using a fully qualified URI, or a CURIE for which a prefix shorthand was previously established on the session.

You can hook up *one callback* to *multiple topics*, and since your callbacks will receive the topic for which they get fired, switch in your callback:

.. code-block:: javascript

   function myCallback(topic, event) {

      switch (topic) {
         case "http://example.com/event#myevent1":
            // handle event 1
            break;
         case "http://example.com/event#myevent2":
            // handle event 2
            break;
         default:
            break;
      }
   };

   sess.subscribe("http://example.com/event#myevent1", myCallback);
   sess.subscribe("http://example.com/event#myevent2", myCallback);

You can also hook up *multiple callbacks* to the *same topic*:

.. code-block:: javascript

   var myEvent1Topic = "http://example.com/event#myevent1";

   sess.subscribe(myEvent1Topic, function (topic, event) {
      // first code to handle event 1
   });

   sess.subscribe(myEvent1Topic, function (topic, event) {
      // more code to handle event 1
   });

Notes

* Upon the first subscribe to a topic, a WAMP message is sent to the server to subscribe the WAMP client for that topic.
* Subsequent subscribes for a topic already previously subscribed to do not trigger a send of another WAMP message. The *client* already has a subscription, and merely registers (client side) the additional callback to be fired for events received on the respective topic.
* A subscribe to a topic *and* for a callback that is already registered raises an exception.
* Multiple callbacks registered for one topic are fired in the order they were registered.


session.unsubscribe
+++++++++++++++++++

Unsubscribe any callback(s) currently subscribed from the given topic.

.. js:function:: wampSession.unsubscribe ( topic )

   :param string topic: The URI or CURIE of the topic to unsubscribe from.

.. code-block:: javascript

   var myTopic = "http://example.com/myEvent1Topic";

   sess.subscribe(myTopic, topicHandler1);
   sess.subscribe(myTopic, topicHandler2);

   sess.unsubscribe(myTopic);

In the above example, events for **'myTopic'** are no longer received, and neither callback handler is fired.



session.unsubscribe
+++++++++++++++++++

Unsubscribe only the given callback currently subscribed from the given topic.

.. js:function:: wampSession.unsubscribe ( topic, callback )

   :param string topic: The URI or CURIE of the topic to unsubscribe from.
   :param function callback: The event handler for which to remove the subscription.

.. code-block:: javascript

   var myTopic = "http://example.com/myEvent1Topic";

   sess.subscribe(myTopic, topicHandler1);
   sess.subscribe(myTopic, topicHandler2);

   sess.unsubscribe(myTopic, topicHandler1);

In the above example, events for **'myTopic'** are still received, but callback handler **'topicHandler1'** is no longer called.


session.publish
+++++++++++++++

Publish the given event (which may be of simple type, or any JSON serializable object) to the given topic.

.. js:function:: wampSession.publish(topic, event)

   :param string topic: The URI or CURIE of the topic to publish to.
   :param object event: The event to be published.

.. code-block:: javascript

   var myTopic = "http://example.com/myEvent1Topic";
   var myEvent = {eventname: "myEvent", eventDetails: ["something happened", "today"]};


   sess.publish(myTopic, myEvent);


session.publish
+++++++++++++++

Publish the given event (which may be of simple type, or any JSON serializable object) to the given topic, specifying whether to exclude myself or not.

.. js:function:: wampSession.publish(topic, event, excludeMe)

   :param string topic: The URI or CURIE of the topic to publish to.
   :param object event: The event to be published.
   :param bool excludeMe: Exclude me (the publisher) from the receivers for this publication (if I am subscribed)

.. code-block:: javascript

   var myEvent1Topic = "http://example.com/event#myevent1";

   sess.subscribe(myEvent1Topic, function(topic, event){
      console.log(topic, event);
   });

   sess.publish(myEvent1Topic, "Hello world!", true);
   sess.publish(myEvent1Topic, "Foobar!", false);

In the above example, only the publication of "Foobar" is sent to the publisher and logged.


session.publish
+++++++++++++++

Publish the given event (which may be of simple type, or any JSON serializable object) to the given topic, specifying a group of clients that do not receive the event, or a group that receives the event.

.. js:function:: wampSession.publish(topic, event, exclude, eligible)

   :param string topic: The URI or CURIE of the topic to publish to.
   :param object event: The event to be published.
   :param array exclude: Explicit list of clients to exclude from this publication, given as array of session IDs.
   :param array eligible: Explicit list of clients that are eligible for this publication, given as array of session IDs.

.. code-block:: javascript

   var myEvent1Topic = "http://example.com/event#myevent1";
   var mySessionId = sess.sessionid();

   sess.subscribe(myEvent1Topic, function(topic, event){
      console.log(topic, event);
   });

   sess.publish(myEvent1Topic, "Hello world!", [], [mySessionId] );
   sess.publish(myEvent1Topic, "Foobar!", [client1SessionId, client23SessionId], [mySessionId]);

In the above example, the first publish is equivalent to setting the option **'excludeMe'** to true.

In the second publish, Clients 1 & 23 would not receive the event, while all other subscribed clients would receive it - including the sender.



Remote Procedure Calls
**********************

session.call
++++++++++++

Publish the given event (which may be of simple type, or any JSON serializable object) to the given topic.

.. js:function:: wampSession.call ( method, ... )

   :param string method: The URI or CURIE of the remote procedure to call.
   :param varargs of object(s) ...: Remote procedure call arguments, zero or more values.

   :returns: (*deferred object*) The call result deferred, upon which you can add success and error processing.


.. code-block:: javascript

   sess.call("http://example.com/rpc1", arg1, arg2, arg3).then(function (result) {
      // do stuff with the result
   }, function(error) {
      // handle the error
   });

* The method to be called is identified by a valid HTTP URI.
* The call may have zero or more arguments.
* Both the success handler and the error handler receive a single return value. This may be any JSON object.
* The error handler is optional.




URI Handling
************

session.prefix
++++++++++++++

Establish the given prefix for use in CURIEs in the session.

.. js:function:: wampSession.prefix ( prefix, uri )

   :param string prefix: The prefix to be established for subsequent use in CURIEs.
   :param string uri: The fully qualified URI to establish a CURIE prefix for.

.. code-block:: javascript

   sess.prefix("myEvents", "http://example.com/events/");
   sess.prefix("myRPCs", "http://example.com/rpcs#");

   sess.subscribe("myEvents:foo");
   sess.call("myRPCs:bar").then(barSuccess, barError);

In the above, *"myEvents:foo"* is equivalent to *"http://example.com/events/foo"* and *"myRPCs:bar"* to *"http://example.com/rpcs#bar"*.



session.shrink
++++++++++++++

Shrink the given fully qualified URI to a CURIE. A CURIE prefix must have been previously defined in this session.

.. js:function:: wampSession.shrink ( uri, pass )

   :param string uri: The fully qualified URI to be shrunk to CURIE.
   :param bool pass: If argument present and true, return the unmodified URI when no prefix was defined previously in this session to shrink the URI.

.. code-block:: javascript

   sess.prefix("myEvents", "http://example.com/events/");

   var foobar = sess.shrink("http://example.com/events/foobar");

In the above, **"foobar"** is assigned as *"myEvents:foobar"*.



session.resolve
+++++++++++++++

Resolves the given CURIE to a fully qualified URI. The CURIE prefix must have been previously defined in this session.

.. js:function:: wampSession.resolve ( curie, pass )

   :param string curie: Resolves the The fully qualified URI to establish a CURIE prefix for.
   :param bool pass: If argument present and true, return the unmodified URI when no prefix was defined to.

.. code-block:: javascript

   sessi.prefix("myEvents", "http://example.com/events/");

   var foobar = sess.resolve("myEvents:foobar");

In the above, **"foobar"** is assigned as *"http://example.com/events/foobar"*.



Settings and Diagnostics
************************

ab.debug
++++++++

Turn on/off debugging of WAMP and/or WebSocket communication.

.. js:function:: ab.debug ( wamp, ws )

   :param bool wamp:  If true, enable debugging of WAMP level communication.
   :param bool ws: If true, enable debugging of WebSocket level communication.


ab.version
++++++++++

Return the AutobahnJS version.

.. js:function:: ab.version ( )

   :returns: (*string*) AutobahnJS version string.


.. _pluggable-promises:

Pluggable Promises
++++++++++++++++++

The promises module to be used can be set by changing the value of ab._Deferred from its default value of "when.defer", e.g.

.. code-block:: javascript

   ab._Deferred = jQuery.Deferred;
