importScripts("autobahn.js")

// open up a WAMP connection to see if this works in a WebWorker

// the URL of the WAMP Router (Crossbar.io)
var wsuri = "ws://127.0.0.1:8080/ws";

// the WAMP connection to the Router
//
var connection = new autobahn.Connection({
   url: wsuri,
   realm: "realm1"
});

connection.onopen = function (session, details) {

   console.log("Connected");

   
};

// fired when connection was lost (or could not be established)
//
connection.onclose = function (reason, details) {
   console.log("Connection lost: " + reason, details);
}

// now actually open the connection
//
connection.open();
