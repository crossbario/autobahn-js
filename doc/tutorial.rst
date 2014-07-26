.. _tutorials:


Introduction to WAMP programming
================================

This introduction takes you step by step through a simple, fully functional WAMP application with the frontend and backend both running in the browser.

You can try a `live version <https://demo.crossbar.io/demo/vote_node/index.html>`_ of this demo (with the backend running in NodeJS), and you find the full code on `GitHub <https://github.com/crossbario/crossbardemo/tree/master/web/demo/vote_browsers>`_, complete with instructions how to run it.

What the application does
-------------------------

The application allows you to vote for one of three flavors of ice cream. Votes are sent to the backend, and vote updates are immediately pushed to all connected clients. You can also reset the vote count, and this also propagates immediately to all other instances.

.. image:: ../_static/vote_screenshot.png

The application uses both WAMP messaging patterns:

* **PubSub**: All clients subscribe to vote update and vote reset events, and the backend publishes these events.
* **RPC**: The backend offers getting the current vote count, voting for a flavor, and resetting the vote count as remote procedures, and clients call these.

.. note:: This demo uses a backend in the browser in order to allow anybody to try it out without the need to install a particular backend technology. For real world use cases, full browser backends are, of course, not recommended. You could run the backend code in NodeJS with minimal adjustments, and a NodeJS version is provided in the demo repository.


Establishing a WAMP connection
++++++++++++++++++++++++++++++

The first ting we need to do in our app's lifecycle, be it for the client or the backend, is to establish a connection to our WAMP router:

.. code-block:: javascript

   var connection = new autobahn.Connection({
      url: "ws://127.0.0.1:8080/ws",
      realm: "votesapp"
   });

This creates an |ab| connection object, and sets the parameters to use when establishing a connection.

The url uses the "ws" scheme for WebSocket instead of "http". Since we're running our WAMP router locally, we use localhost. The port and path can be configured in Crossbar.io, the WAMP router we are using. (This allows serving Web assets under different paths.)

Each connection is connected to a **realm**. Realms serve to separate routing for different applications.

The connection object has two hooks for callbacks: on successfull connection establishment ('onopen'), and on the connection establishment failing of the connection closing later on ('onclose'.

We defined these:

.. code-block:: javascript

   connection.onopen = function (session, details) {

      main(session);

   };


   connection.onclose = function (reason, details) {

      console.log("Connection lost: " + reason);

   }

The 'onopen' handler receives a |ab| session object and a dictionary of connection details. All WAMP PubSub and RPC interaction occurs using this object. We call our main function, containing all actual app functionality, and pass it this session object.

For 'onclose', all we do here is log the reason and details of why the connection establishment failed or the connection closed.

Finally, we need to actually open a connection:

.. code-block:: javascript

   connection.open();


Backend
-------

The backend of our app is very simple. It
* delivers the current vote count to a client when requested,
* receives vote submissions, updates the vote count, and publishes the new count to all clients
* receives a vote reset, resets the vote counts, and publishes the reset event to all clients.

For storing the vote count we us a simple object:

.. code-block:: javascript

   var votes = {
      Banana: 0,
      Chocolate: 0,
      Lemon: 0
   };

The functionality is offered via three functions which can be called remotely by clients:

.. code-block:: javascript

   // return set of present votes on request
   var getVote = function() { ... };

   // handle vote submission
   var submitVote = function(args, kwargs, details) { ... };

   // reset vote count
   var resetVotes = function() { ... };


Neither 'getVote' nor 'resetVotes' require any arguments. 'submitVote' receives three arguments: WAMP handles both argument lists and keyword arguments, and both are passed on each call (even though they may be emtpy). 'details' is an additional dictionary created by the WAMP router containing information about the caller. (This may e.g. be used to exempt a caller from receiving a PubSub event created based on the call.)

In order for the functions be callable by clients, we need to register them with the WAMP router:

.. code-block:: javascript

   // register the procedures
   session.register('io.crossbar.demo.vote.get', getVote);
   session.register('io.crossbar.demo.vote.vote', submitVote);
   session.register('io.crossbar.demo.vote.reset', resetVotes);

Function registration needs to provide an indentifier which is used when calling the function. For these WAMP uses URIs, in Java packet notation. URIs are an established, easy way for namespace management.

Let's now have a look at the functions themselves.

Returning present vote count
++++++++++++++++++++++++++++

.. code-block:: javascript

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

Here we just define an array to contain the vote count and then construct its contents from our votes dictionary.
This is then returned to the caller.


Handling vote submissions
+++++++++++++++++++++++++

.. code-block:: javascript

   var submitVote = function(args, kwargs, details) {
      var flavor = args[0];
      votes[flavor] += 1;

      var evt = {
         subject: flavor,
         votes: votes[flavor]
      };

      // publish the vote event
      session.publish("io.crossbar.demo.vote.onvote", [evt]);

      return "voted for " + flavor;
   };

A vote submission has the flavor the vote has been cast for as its sole argument. We get this from the arguments list ('args'), and increase the relevant vote count.
Here we return just the fact that the vote has been registered to the caller (`return "voted for " + flavor`).

We don't return the current vote count because the caller will be notified just like all other clients: via a PubSub event.

The payload for this is a dictionary containing two key/value pairs identifying the flavor and the vote count. This is then published as a 'onvote' event:

.. code-block:: javascript

   session.publish("io.crossbar.demo.vote.onvote", [evt]);

Here a URI is used to identify the topic the event is for.

The event is then distributed to all clients connected to the same realm as the publisher and who have subscribed to this topic (i.e., in our application, all clients).


Reseting the vote count
+++++++++++++++++++++++

.. code-block:: javascript

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

The vote count is simple: we reset the vote count in our local votes dictionary, and publish the fact that a vote reset call was received. Just like with the vote submission, all we return to the caller is an acknowledgement of the call.


Client
------

The HTML is very basic - there's no real need to explain anythin. For each flavor, all we really need is something to display the current count and a vote button. In only other interactive element is the reset button. If you're interested, here's the `full markup <link to html in repo>`_.

The client needs to get the current vote count on connecting, subscribe to vote update and vote reset events, and send votes and vote resets.


Get the current vote count
++++++++++++++++++++++++++

.. code-block:: javascript

   session.call("io.crossbar.demo.vote.get").then(
      function(res){
         for(var i = 0; i < res.length; i++) {
            document.getElementById("votes" + res[i].subject).value =
               res[i].votes;
         }
   }, session.log);


The above is a WAMP call. Each call is to a specific procedure - identified by the URI that our backend registered it for. For this call we don't need to send any additional arguments.

One of two callback functions is fired depending on whether the call succeeds or fails. In the first case, we give a function to handle the result (`res`). In case of failure or error, we use 'session.log' which is a convenience function that logs both the error details and some session data to the console.

.. note:: |ab| uses **promises**, not conventional callbacks. **Promises** offer powerful features for async programming. However, for this app, you can think of them just like a different notation for callbacks. If you want to learn more about promises, `this article <http://www.mattgreer.org/articles/promises-in-wicked-detail/>`_ is a good place to start.


As we've seen above, the result of the call for current votes is a list of objects. We just iterate over this and update the values of our vote display.


Subscribe to future vote events
+++++++++++++++++++++++++++++++

Since we want to get the vote updates, we need to subscribe to them:

.. code-block:: javascript

   session.subscribe("io.crossbar.demo.vote.onvote",
      function(args, kwargs, details) {
         var event = args[0];
         document.getElementById("votes" + event.subject).value =
            event.votes;
      });

We call the `subscribe` method on the `session` object and pass it the URI for the topic we're interested in. We also give it a callback to fire whenever an event has been received.

This callback receives three arguments of a similar structure to those received by a called procedure. Here the payload is the object containing the flavor and vote count. We extract this and update the value of the respective vote display.

!!!!!!!!! should really be delivered as kwargs to make the difference clear and give wider range of examples !!!!!!!!!


Subscribe to vote reset event
+++++++++++++++++++++++++++++

The subscription to the vote reset event is very similar:

.. code-block:: javascript

   session.subscribe("io.crossbar.demo.vote.onreset", function() {
         var voteCounters = document.getElementById("voteContainer").
                                     getElementsByTagName("input");
         for(var i = 0; i < voteCounters.length; i++) {
            voteCounters[i].value = 0;
         }
      });

Here we don't receive any arguments as part of the event, and just iterate over our vote displays and reset them to 0.

Submit a vote
+++++++++++++

.. code-block:: javascript

   var voteButtons = document.getElementById("voteContainer").
                              getElementsByTagName("button");
   for (var i = 0; i < voteButtons.length; i++) {
      voteButtons[i].onclick = function(evt) {
         session.call("io.crossbar.demo.vote.vote",
            [evt.target.id]).then(session.log, session.log);
      };
   }

We iterate over our vote buttons and add a click handler for each. In the click handler, we issue a call to the 'vote' procedure on the backend, with the ice cream flavor as the argument.

All we do with the return is log it - the vote change happens based on the subscription event the backend publishes and that we subscribed to above.


Send a vote reset
+++++++++++++++++

.. code-block:: javascript

   document.getElementById("resetVotes").onclick = function() {
      session.call("io.crossbar.demo.vote.reset").
         then(session.log, session.log);
   };

We attach a click handler to the reset button. This calls the `reset` function on the backend. Again, as with the call to the `vote` function, we only log the return, since the reset happens based on a subscription event.


Extensions:

- Exclude the caller from the publication and effect changes in caller client based on the call return

- separate the backend procedures into three different components on different machines: each registers one. doesn't really make sense since it needs extensive backend coordination, but just to demonstrate.
   coordination: general "vote count change" event




