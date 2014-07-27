.. _tutorials:


Introduction to WAMP programming
================================

This introduction takes you step by step through a simple, fully functional WAMP application with the frontend and backend both running in the browser.

You can try a `live version <https://demo.crossbar.io/demo/vote_node/index.html>`_ of this demo (with the backend running in NodeJS), and you find the full code on `GitHub <https://github.com/crossbario/crossbardemo/tree/master/web/demo/vote_browsers>`_, complete with instructions how to run it.

What the application does
-------------------------

The application allows you to vote for one of three flavors of ice cream. Votes are sent to the backend, and vote updates are immediately pushed to all connected frontends. You can also reset the vote count, and this also propagates immediately to all other instances.

.. image:: ../_static/vote_screenshot.png

The application uses both WAMP messaging patterns:

* **RPC**:
  + The backend offers remote procedures for getting the current vote count, voting for a flavor, and resetting the vote count.
  + Frontends call these remote procedures.

* **PubSub**:

  + Frontends subscribe to vote update and vote reset events.
  + The backend publishes vote updates and vote resets events.

.. note:: This demo uses a backend in the browser in order to allow anybody to try it out without the need to install a particular backend technology. For real world use cases, full browser backends are, of course, not recommended. You can run the backend code in NodeJS with minimal adjustments, and a NodeJS version is provided in the demo repository.


Establishing a WAMP connection
------------------------------

For both the frontend and the backend, before we do any WAMP messaging, we need to establish a connection to our WAMP router.

We first create an |ab| connection object, and set the parameters to use when establishing a connection:

.. code-block:: javascript

   var connection = new autobahn.Connection({
      url: "ws://127.0.0.1:8080/ws",
      realm: "votesapp"
   });

WAMP uses WebSocket as its standard transport - so the url uses the "ws" scheme for WebSocket instead of "http". Since we're running our WAMP router locally, we use localhost as the IP. The port and path for the WebSocket endpoint that we're connecting to can be configured in Crossbar.io, the WAMP router we are using. (This allows serving Web assets under different paths on the same IP.)

Each connection is connected to a **realm**. Realms serve to separate routing for different applications, i.e. an application connected to one realm will not receive any messages from an application connected to another realm.

The connection object has two hooks for callbacks:

* `onopen` fires on successfull establishment of the connection
* `onclose`fires on the connection establishment failing or when the established connection closes

We define what happens in each case:

.. code-block:: javascript

   connection.onopen = function (session, details) {

      main(session);

   };


   connection.onclose = function (reason, details) {

      console.log("Connection lost: " + reason);

   }

The 'onopen' handler receives an |ab| session object and a dictionary of connection details. All subsequent WAMP PubSub and RPC interaction occurs using this object. We call our main function which sets up the app messaging functionality, and pass it this session object.

The 'onclose' handler receives a reason for closing as well as details. All we do for our demo app is log these.

Finally, we need to actually open the connection:

.. code-block:: javascript

   connection.open();

Once the connection establishment succeeds, our `onopen` handler fires, and the messaging is set up in our respective `main` functions.


Remote Procedure Calls (RPC)
----------------------------

The backend of our demo app needs to enable the frontends to

* request the current vote count (on initial connection or reconnect)
* submit a vote
* trigger a vote reset

The backend offers a procedure for each of these actions that frontends can call.

We first need to define these procedures (function bodies will be explained further below):

.. code-block:: javascript

   // return set of present votes on request
   var getVote = function() { ... };

   // handle vote submission
   var submitVote = function(args, kwargs, details) { ... };

   // reset vote count
   var resetVotes = function() { ... };

Then we register them with the WAMP router so that clients can call them:

.. code-block:: javascript

   // register the procedures
   session.register('io.crossbar.demo.vote.get', getVote);
   session.register('io.crossbar.demo.vote.vote', submitVote);
   session.register('io.crossbar.demo.vote.reset', resetVotes);

Function registration needs to provide an indentifier which is used by the client when calling the function. For these WAMP uses URIs, in Java packet notation. URIs are an established, easy way for namespace management.

Our clients then call these procedures, e.g.

.. code-block:: javascript

   session.call("io.crossbar.demo.vote.get").then(
      function(res){ ... }
   }, session.log);

The WAMP router forwards the call to the backend which has registered a procedure for the URI 'io.crossbar.demo.vote.get'. The backend sends the result to the WAMP router, and this returns it to the caller.

In the caller, a callback functions is fired and the result (`res`) of the call passed to it.

In case of failure of the call, the router returns an error object. This is passed as an argument to the second callback we define. Here we use the `log` function on the `session` object to log both the error code and some information about the session.

.. note:: |ab| uses **promises**, not conventional callbacks. **Promises** offer powerful features for async programming, and allow you to do way more than is shown here. However, within the scope of this demo app, you can think of them just like a different notation for callbacks. If you want to learn more about promises, `this article <http://www.mattgreer.org/articles/promises-in-wicked-detail/>`_ is a good place to start.



The functions in detail
+++++++++++++++++++++++

For **getting the current vote count**, the backend function is:

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

The votes are stored in a dictionary, and `getVote` constructs an array from this. This array is then returned.

The frontend iterates over this array and updates the displayed vote counts:

.. code-block:: javascript

   session.call("io.crossbar.demo.vote.get").then(
      function(res){
         for(var i = 0; i < res.length; i++) {
            document.getElementById("votes" + res[i].subject).value =
               res[i].votes;
         }
   }, session.log);


For **submitting a vote**, the backend function is:

.. code-block:: javascript

   var submitVote = function(args, kwargs, details) {
      var flavor = args[0];
      votes[flavor] += 1;

      return "voted for " + flavor;
   };

This just returns an acknowledgement that the vote has been registered.

In the frontend, we wire up our vote buttons issue the `vote`call when clicked:

.. code-block:: javascript

   var voteButtons = document.getElementById("voteContainer").
                              getElementsByTagName("button");
   for (var i = 0; i < voteButtons.length; i++) {
      voteButtons[i].onclick = function(evt) {
         session.call("io.crossbar.demo.vote.vote",
            [evt.target.id]).then(session.log, session.log);
      };
   }


And, finally, for the vote reset, in the backend we just set each vote value in our votes dict to 0 and return an acknowledgement:

.. code-block:: javascript

   var resetVotes = function() {
      for (var fl in votes) {
         if (votes.hasOwnProperty(fl)) {
            votes[fl] = 0;
         }
      }
      return "votes reset";
   };

In the frontend, we wire up the vote reset button:

.. code-block:: javascript

   document.getElementById("resetVotes").onclick = function() {
      session.call("io.crossbar.demo.vote.reset").
         then(session.log, session.log);
   };


Publish and Subscribe (PubSub)
------------------------------

For submitting a vote and triggering a vote reset, in the code above we've only triggered the backend changes. Nothing has changed in our frontend.

This is because we'll handle the changes in the frontend sending the call and in all other connected frontends using the same mechanism: PubSub events.

Each frontend subscribes to two events:

* new vote submissions
* vote resets

This is done like:

.. code-block:: javascript

   session.subscribe("io.crossbar.demo.vote.onvote", function(args, kwargs, details) {});
   session.subscribe("io.crossbar.demo.vote.onreset", function() {});

Whenever an event is received, the respective callback is fired. In the case of a vote submission, we need to know which flavor was voted for, so we process arguments. In the case of the vote reset, the fact that the event has occured is all the information we need.

In the backend, we need to publish the respective events.

For the `resetVotes` function, this is just a single line:#

.. code-block:: javascript

      session.publish("io.crossbar.demo.vote.onreset");

For `submitVote`, we need to construct the object we're publishing as the event payload:

.. code-block:: javascript

      var evt = {
         subject: flavor,
         votes: votes[flavor]
      };

      // publish the vote event
      session.publish("io.crossbar.demo.vote.onvote", [evt]);

In our frontend, vote submissions trigger an update of the respective vote display:

.. code-block:: javascript

   session.subscribe("io.crossbar.demo.vote.onvote",
      function(args, kwargs, details) {
         var event = args[0];
         document.getElementById("votes" + event.subject).value =
            event.votes;
      });

and a vote reset sets all these displays to 0:

.. code-block:: javascript

   session.subscribe("io.crossbar.demo.vote.onreset", function() {
         var voteCounters = document.getElementById("voteContainer").
                                     getElementsByTagName("input");
         for(var i = 0; i < voteCounters.length; i++) {
            voteCounters[i].value = 0;
         }
      });



Where to go from here
---------------------

* If you want to look at the full demo code, go to the `GitHub repository <>`_. This also has instructions for how to run the demo.
* There's an :doc:`**overview of example code for specific WAMP features** <examples_overview>`.
