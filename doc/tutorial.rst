.. _tutorials:


Introduction to WAMP programming
================================

This introduction takes you step by step through a **simple, fully functional WAMP application** with the frontend and backend both running in the browser.

We'll cover the **structure** of the application and the **WAMP messaging parts** - the things which aren't standard, plain JavaScript. We'll leave out the standard stuff such as click handlers, updating HMTL elements with values, and handling data structures. If you're interested, then a look at the source will tell you all you need to know about that.

You find the full code on `GitHub <https://github.com/tavendo/autobahnJS/tree/master/doc/_static/code/votes>`_.

What the application does
-------------------------

The application allows you to vote for one of three flavors of ice cream.

Votes are sent to the backend, and vote updates are **immediately pushed** to all connected frontends.

You can also reset the vote count, and this also propagates immediately to all other instances.

.. image:: /_static/img/vote_screenshot.png

The application uses both WAMP messaging patterns:

* **RPC**:

  + The backend offers remote procedures for getting the current vote count, voting for a flavor, and resetting the vote count.
  + Frontends call these remote procedures.

* **PubSub**:

  + Frontends subscribe to vote update and vote reset events.
  + The backend publishes vote updates and vote resets events.

.. note:: This demo uses a backend in the browser in order to allow anybody to try it out without the need to install a particular backend technology. For a more real world use cases you can **run the backend code in NodeJS** with minimal adjustments, and a NodeJS version is provided in the demo repository.


Running a WAMP router
---------------------

WAMP messages are not exchanged directly between application components. All components connect to a WAMP router, which then handles the message passing.

There are `multiple compatible WAMP routers <http://wamp.ws/implementations/>`_, but we suggest using `Crossbar.io <http://crossbar.io>`_, which can generate this demo ready-to-run from an integrated template.

Installation instructions for Crossbar.io can be found at the `Crossbar.io project website <http://crossbar.io/docs/>`_. Once you've installed Crossbar.io, just do

::

   crossbar init --template votes:browser --appdir votes_browser

which will create a directory ``votes_browser`` and copy all necessary files there.

Finally, go to the demo directory and do:

::

   crossbar start

You can then access the demo overview page at ``http://localhost:8080``.

Otherwise use a WAMP router of your choosing with the files in the `demo repository <https://github.com/tavendo/autobahnJS/master/test/votes>`_.


Including Autobahn
------------------

We need to include the |ab| library in our JavaScript. This can be as easy as

.. code-block:: html

   <script src="https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz">
   </script>

For other options see the :doc:`setup page <gettingstarted>`.


Establishing a WAMP connection
------------------------------

For both the frontend and the backend, before we do any WAMP messaging, we need to establish a connection to our WAMP router.

We first create an |ab| ``connection`` object, and set the parameters to use when establishing the connection:

.. code-block:: javascript

   var connection = new autobahn.Connection({
      url: "ws://127.0.0.1:8080/ws",
      realm: "votesapp"
   });

* WAMP uses WebSocket as its standard transport - so the url uses the ``ws`` **scheme** for WebSocket instead of ``http``.
* Since we're running our WAMP router locally, we use localhost (i.e. ``127.0.0.1``) as the **IP**.
* The **port** (``8080``) and **path** (``/ws``) for the WebSocket endpoint that we're connecting to can be configured in Crossbar.io, the WAMP router we are using. (This allows serving Web assets under different paths on the same IP.)
* Each connection is connected to a **realm**. Realms serve to separate routing for different applications, i.e. an application connected to one realm will not receive any messages from an application connected to another realm.

The ``connection`` object has two **hooks for callbacks**:

* ``onopen`` fires on successfull establishment of the connection
* ``onclose`` fires on the connection establishment failing or when the established connection closes

We define what happens in each case:

.. code-block:: javascript

   connection.onopen = function (session, details) {
      main(session);
   };


   connection.onclose = function (reason, details) {
      console.log("Connection lost: " + reason);
   }

The ``onopen`` handler receives an |ab| ``session`` object and a dictionary of connection details. All subsequent WAMP PubSub and RPC interaction occurs using the ``session`` object. We **call our** ``main`` **function** which sets up the app messaging functionality, and pass it the ``session`` object.

The ``onclose`` handler receives a reason for closing as well as details. All we do for our demo app is **log the reason**.

Finally, we need to actually open the connection:

.. code-block:: javascript

   connection.open();

Once the connection establishment succeeds, our ``onopen`` handler fires, and the messaging is set up in our respective ``main`` functions.


Remote Procedure Calls (RPC)
----------------------------

The backend of our demo app needs to enable the frontends to

* request the current vote count (on initial connection or reconnect)
* submit a vote
* trigger a vote reset

The backend offers a procedure for each of these actions that frontends can call.

We first need to **define the functions for the procedures**:

.. code-block:: javascript

   var getVote = function() { ... };

   var submitVote = function(args, kwargs, details) { ... };

   var resetVotes = function() { ... };

Then we **register the functions** with the WAMP router so that clients can call them:

.. code-block:: javascript

   session.register('io.crossbar.demo.vote.get', getVote);
   session.register('io.crossbar.demo.vote.vote', submitVote);
   session.register('io.crossbar.demo.vote.reset', resetVotes);

Function registration needs to provide an **indentifier** which is used by the client when calling the function. For these WAMP uses **URIs**, in Java packet notation. URIs are an established, easy way for namespace management.

Our clients then call these procedures, e.g.

.. code-block:: javascript

   session.call("io.crossbar.demo.vote.get").then(
      function(res){ ... }
   }, session.log);

On a WAMP call
* The WAMP router forwards the call to the backend which has registered a procedure for the URI 'io.crossbar.demo.vote.get'.
* The backend sends the result to the WAMP router.
* The WAMP router returns the result to the caller.

In the caller, on a successfull return the **success handler** function is fired, i.e. the first function we define after ``then``. The result (`res`) of the call is passed to it.

In case of failure of the call, the router returns an error object. This is passed as an argument to the second callback we define, our **error handler**. Here we use the ``log`` function on the ``session`` object to log the error code and some additional information about the session.

.. note:: |ab| uses **promises**, not conventional callbacks. **Promises** offer powerful features for async programming, and allow you to do way more than is shown here. However, within the scope of this demo app, you can think of them just like a different notation for callbacks. If you want to learn more about promises, `this article <http://www.html5rocks.com/en/tutorials/es6/promises/>`_ is a good place to start.


Publish and Subscribe (PubSub)
------------------------------

In our submitting a vote example above, our frontend only logs the call result, and does not change the displayed vote count. This is because changes to vote counts (increases or resets) are handled using PubSub events.

Each frontend subscribes to two events:

* new vote submissions
* vote resets

This is done like:

.. code-block:: javascript

   session.subscribe("io.crossbar.demo.vote.onvote", function(args) { ... });

   session.subscribe("io.crossbar.demo.vote.onreset", function() { ... });

Whenever an event is received, the respective callback is fired. In the case of a vote submission, we need to know which flavor was voted for, so we process arguments. In the case of the vote reset, the fact that the event has occured is all the information we need.

In the backend, we need to publish the respective events. This is done by adding a single line to the respective functions, i.e. ``resetVotes`` and ``submitVote``

.. code-block:: javascript

      session.publish("io.crossbar.demo.vote.onreset");

.. code-block:: javascript

      session.publish("io.crossbar.demo.vote.onvote", [evt]);

This published event is then sent to all connected frontends which are subscribed to the respective topic. This means that **all frontends are updated simultaneously**.


Summary
-------

Integrating WAMP into your JavaScript apps is easy: Fire up a WAMP router, include |ab| in your project, add a few lines of boilerplate connection code - and you're ready to publish, subscribe, call and register.

|ab| and WAMP have a lot of additional features, but you can discover those as you need them. The basics you need to get started are simple.


Where to go from here
---------------------

* There's an :doc:`overview of example code for specific WAMP features <examples_overview>`.
* Read about `the idea behind WAMP. <http://wamp.ws/why/>`_
* Explore WAMP's features by looking at the `spec <http://wamp.ws/spec/>`_
