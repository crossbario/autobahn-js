.. _votes_tutorial:


Tutorial: A simple WAMP application
===================================

This introduction takes you step by step through a **simple, fully functional WAMP application** with the frontend and backend both running in the browser.

We'll cover the entire code of the application, both frontend and backend, with a special focus on the **WAMP messaging parts**. In the course of this we'll cover both messaging patterns which WAMP supports: Remote Procedure Calls (RCP) and Publish and Subscribe (PubSub).

You find the full code on `GitHub <https://github.com/tavendo/autobahnJS/tree/master/doc/_static/code/votes>`_, including instructions how to best run the demo.

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

.. note:: This demo uses a backend in the browser in order to allow anybody to try it out without the need to install a particular backend technology. For a more real world use cases you can **run the backend code in NodeJS** with minimal adjustments. A NodeJS version is provided in the demo repository. 


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


Crossbar includes a static Web server, and the template configured this so that it serves our demo resources.

You can then access the demo overview page at ``http://localhost:8080``, and this allows you to start a backend and the frontends.

Otherwise use a WAMP router of your choosing with the files in the `demo repository <https://github.com/tavendo/autobahnJS/tree/master/doc/_static/code/votes>`_.


Including Autobahn
------------------

We need to include the |ab| library, which provides the WAMP functionality, in our JavaScript. The libaray is provided as part of the template and in the demo repository, so we do 

.. code-block:: html

   <script src="js/autobahn.min.js"></script>

For development, it's also advisable to enable debugging, so that |ab| tells us a bit about what's happening. This is achieved like so:

.. code-block:: html

<script>AUTOBAHN_DEBUG = true;</script>
   <script src="js/autobahn.min.js"></script>

(For getting |ab| for your own projects, see the :doc:`setup page <gettingstarted>`.)


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

* ``onopen`` fires on successful establishment of the connection
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


The frontend markup
-----------------

There's nothing special about the markup for the frontend, but we'll go over the basics quickly since this will help. For each of the flavors, we have the same structure. Here's 'Banana' as an example:

.. code-block:: html

   <div>
      <img src="img/banana_small.png" alt="CC attribution license, Evan-Amos/EABanner">
      <span>
         Banana
      </span>
      <div>
         <input type="text" id="votesBanana" disabled>
         </input>
      </div>
      <br>
      <button id="Banana">
         Vote
      </button>
   </div>

There's the image, the lable - and the two elements that we'll be dealing with in our frontend JavaScript: the ``input`` element which displays the current vote count, and the ``button`` used to vote for the flavor. The former we need to set and update, the latter we need to wire up for the vote action.


The frontend JavaScript
-----------------------

All of the frontend functionality is executed within our ``main`` function which gets called once the WAMP session has been established. We interact with the WAM? session through the ``session`` object.

Getting the current vote count
++++++++++++++++++++++++++++++

The first thing we want to do is display the current vote counts - so we request these from the backend. With WAMP, this is done as a remote procedure call:

.. code-block:: javascript

   // get the current vote count
   session.call("io.crossbar.demo.vote.get").then(
      function(res){
         for(var i = 0; i < res.length; i++) {
            document.getElementById("votes" + res[i].subject).value =
               res[i].votes;
         }
   }, session.log);

We use the ``call`` method on the ``session`` object, and pass this a single argument: an URI which identifies the procedure we want to call. With a WAMP call, what happens then is

* The WAMP router forwards the call to the backend which has registered a procedure for the URI 'io.crossbar.demo.vote.get'.
* The backend sends the result to the WAMP router.
* The WAMP router returns the result to the caller.

In our frontend, which here is the caller, on a successful return the **success handler** function is fired, i.e. the first function we define after ``then``. The result (`res`) of the call is passed to it.

In case of failure of the call, the router returns an error object. This is passed as an argument to the second callback we define, our **error handler**. Here all we do is use the ``log`` function on the ``session`` object to log the error code and some additional information about the session.

.. note:: |ab| uses **promises**, not conventional callbacks. **Promises** offer powerful features for async programming, and allow you to do way more than is shown here. However, within the scope of this demo app, you can think of them just like a different notation for callbacks. If you want to learn more about promises, `this article <http://www.html5rocks.com/en/tutorials/es6/promises/>`_ is a good place to start.

.. note:: WAMP uses URIs to identify procedures (and topics, see below). The URIs are in Java package notation, i.e. start with the TLD and then go to the more specific parts. The choice of URIs is because these present an established, global mechanism for namespacing.

The result we get here is an array of three objects, one for each flavor. We iterate over this array, and for each object we get the ``input`` element for the flavor (using the ``subject`` value) and set this to the current count (the ```votes`` value).


Subscribing to vote changes
+++++++++++++++++++++++++++

We also want to be able to display vote updates. Instead of querying the backend constantly (by doing repeat RPCs), we want to be notified of updates, i.e. we want the backend to push these to us. This is accomplished using the Publish and Subscribe pattern that WAMP provides:

* We tell the backend what type of event we are interested in.
* When the backend receives an event of this type, it dispatches it to us (and to all other subscribers for the same type).

Subscribing to the updates is done like:

.. code-block:: javascript

   // subscribe to future vote event
   session.subscribe("io.crossbar.demo.vote.onvote",
      function(args) {
         var event = args[0];
         document.getElementById("votes" + event.subject).value =
            event.votes;
      });

Subscriptions are for topics, and topics (just like procedures) are identified by an URI. Together with the topic we pass a function which gets called each time an event for the topic is received.

The event itself is wrapped in an array. (The function is also passed an object for keyword arguments and a details object, but we don't need these here. The array + object format allows better cross-language compatibility, but may be a bit confusing at first when using |ab|.) We extract this event - which is an object like the ones we receive in the above call for the initial vote count. The updating itself is then just like it was for the initial setting - just for a single flavor.


Subscribing to the vote reset event
+++++++++++++++++++++++++++++++++++

Apart from voting, there's also the possibility to reset the votes. This is the second event that we need to subscribe to:

.. code-block:: javascript

   // subscribe to vote reset event
   session.subscribe("io.crossbar.demo.vote.onreset", function() {
         var voteCounters = document.getElementById("voteContainer").
                                     getElementsByTagName("input");
         for(var i = 0; i < voteCounters.length; i++) {
            voteCounters[i].value = 0;
         }
      });

The vote reset event does not contain any payload - the fact that it fires is all the information we need. We then get all the vote display elements (this is where it comes in handy that we use input elements - we can just select all of these from the container element around our three flavors). Then we iterate over these and reset them to "0".


Wiring up the vote buttons
++++++++++++++++++++++++++

A press on a vote button needs to trigger sending the vote to the backend. To get this, we get all the vote buttons in the container for our flavors, iterate over them, and add an ``onclick`` handler to them:

.. code-block:: javascript

   // wire up vote buttons
   var voteButtons = document.getElementById("voteContainer").
                              getElementsByTagName("button");
   for (var i = 0; i < voteButtons.length; i++) {
      voteButtons[i].onclick = function(evt) {
         session.call("io.crossbar.demo.vote.vote", 
            [evt.target.id]).then(session.log, session.log);
      };
   }

The handler itself issues a RPC. The procedure called is the same regardless of flavor - the particular flavor is passed as an additional argument (we get this from the id of the clicked button). Here we don't need to do anything particular with the return for the call, so we just log it. The actual update to the vote count is done in response to the update event we receive just like any other connected frontend.


Wiring up the reset button
++++++++++++++++++++++++++

Wiring up the reset button is even simpler. There's just a single button, and a single call without any arguments:

.. code-block:: javascript

   // wire up reset button
   document.getElementById("resetVotes").onclick = function() {
      session.call("io.crossbar.demo.vote.reset").
         then(session.log, session.log);
   };


The backend JavaScript
----------------------

The backend needs to store the current vote count, and allow frontends to retrieve this information, vote for a flavor, and reset the votes. It does so by providing the three procedures that our frontend code calls. In addition, it needs to notify the frontends whenever a vote count has changed or when a vote reset has been requested.

For something as simple as this, were we don't need any persistence, it's easiest to just store the votes in an object:

.. code-block:: javascript

   var votes = {
      Banana: 0,
      Chocolate: 0,
      Lemon: 0
   };

Again, like with the frontend, our code itself is contained in the ```main`` function, which is called on session establishment.


Delivering the current vote count
+++++++++++++++++++++++++++++++++

The procedure which delivers the current vote count needs to return an array of flavor count objects (this is easier to handle in the frontend).

.. code-block:: javascript

   // return set of present votes on request
   var getVote = function() {
      var votesArr = [];
      for (var flavor in votes) {
         if (votes.hasOwnProperty(flavor)) {
            votesArr.push({
               subject: flavor,
               votes: votes[flavor]
            })
         }
      }
      return votesArr;
   };

We iterate over our backend votes object, and construct the array we need to send to the frontend. We then return this.

This procedure as is would, of course, not be callable by the frontend. For this we need to register it with the WAMP router, giving the URI under which it should be reachable.

All it takes to register is a single line:

.. code-block:: javascript

session.register('io.crossbar.demo.vote.get', getVote);

The ``register`` method takes an URI for the procedure, and the procedure itself as arguments. Our procedure is then callable by any connected WAMP client.


Handling vote submissions
+++++++++++++++++++++++++

For vote submissions, we similarily register a procedure:

.. code-block:: javascript

   session.register('io.crossbar.demo.vote.vote', submitVote);

The procedure itself needs to increment the vote counter - and it also returns the fact that the vote has been registered (which we log in our frontend)

.. code-block:: javascript

   var submitVote = function(args) {
      var flavor = args[0];
      votes[flavor] += 1;

      return "voted for " + flavor;
   };

In addition to this, it needs to notify all connected frontends of the vote update. The notification contains an obect with the flavor and count (as ``subject`` and ``votes``) and needs to be published to the topic which the frontends have subscribed to. The code for this, which we add to the above function, is:

.. code-block:: javascript

      var res = {
         subject: flavor,
         votes: votes[flavor]
      };

      // publish the vote event
      session.publish("io.crossbar.demo.vote.onvote", [res]);

Publication to the topic is done via the ``publish`` method on the ``session`` object. This takes the topic URI and the event payload as arguments.

Handling reset requests
+++++++++++++++++++++++

The reset request introduces nothing new in addition to the above two procedures: it's registered for its URI, resets the backend vote count, and publishes an reset event to the frontends:

.. code-block:: javascript

   // reset vote count
   var resetVotes = function() {
      for (var fl in votes) {
         if (votes.hasOwnProperty(fl)) {
            votes[fl] = 0;
         }
      }
      // publish the reset event
      session.publish("io.crossbar.demo.vote.onreset");

      return "votes reset";
   };

   session.register('io.crossbar.demo.vote.reset', resetVotes);

And that's it - the entire backend is just the three procedures above, with a simple, one-line registration for each.


Summary
-------

The code for our votes demo app is as simple as it gets. This includes the WAMP functionality: with just a few lines each in the frontend and the backend, we've added calling procedures on the backend and live update functionality. All our frontends display vote count changes instantly and in sync. WAMP handles all of the messaging with the backend. Crossbar.io handles procedure registrations and subscriptions, which means that we're free to concentrate on focussing our energy where it provides real value: implementing application functionality. 


Where to go from here
---------------------

* There's an :doc:`overview of example code for specific WAMP features <examples_overview>`.
* Read about `the idea behind WAMP. <http://wamp.ws/why/>`_
* Explore WAMP's features by looking at the :doc:`API reference <reference>`_

