var autobahn = require('./../index.js'); 


function ping() {      
}

function add2(args) {
   return args[0] + args[1];
}

function stars(args, kwargs) {
   kwargs = kwargs || {};
   kwargs.nick = kwargs.nick || "somebody";
   kwargs.stars = kwargs.stars || 0;
   return kwargs.nick + " starred " + kwargs.stars + "x";
}

var _orders = [];
for (var i = 0; i < 50; ++i) _orders.push(i);

function orders(args, kwargs) {
   kwargs = kwargs || {};
   kwargs.limit = kwargs.limit || 5;
   return _orders.slice(0, kwargs.limit);
}

function arglen(args, kwargs) {
   args = args || [];
   kwargs = kwargs || {};
   return [args.length, Object.keys(kwargs).length];
}

endpoints = {
   'com.arguments.ping': ping,
   'com.arguments.add2': add2,
   'com.arguments.stars': stars,
   'com.arguments.orders': orders,
   'com.arguments.arglen': arglen
};


function test1(session) {

   var dl = [];

   dl.push(session.call('com.arguments.ping').then(
      function () {
         console.log("Pinged!");
      }
   ));

   dl.push(session.call('com.arguments.add2', [2, 3]).then(
      function (res) {
         console.log("Add2:", res);
      }
   ));

   dl.push(session.call('com.arguments.stars').then(
      function (res) {
         console.log("Starred 1:", res);
      }
   ));

   dl.push(session.call('com.arguments.stars', [], {nick: 'Homer'}).then(
      function (res) {
         console.log("Starred 2:", res);
      }
   ));

   dl.push(session.call('com.arguments.stars', [], {stars: 5}).then(
      function (res) {
         console.log("Starred 3:", res);
      }
   ));

   dl.push(session.call('com.arguments.stars', [], {nick: 'Homer', stars: 5}).then(
      function (res) {
         console.log("Starred 4:", res);
      }
   ));

   dl.push(session.call('com.arguments.orders', ['coffee']).then(
      function (res) {
         console.log("Orders 1:", res);
      }
   ));

   dl.push(session.call('com.arguments.orders', ['coffee'], {limit: 10}).then(
      function (res) {
         console.log("Orders 2:", res);
      },
      function (err) {
         console.log(err);
      }
   ));

   dl.push(session.call('com.arguments.arglen').then(
      function (res) {
         console.log("Arglen 1", res);
      }
   ));

   dl.push(session.call('com.arguments.arglen', [1, 2, 3]).then(
      function (res) {
         console.log("Arglen 2", res);
      }
   ));

   dl.push(session.call('com.arguments.arglen', [], {a: 1, b: 2, c: 3}).then(
      function (res) {
         console.log("Arglen 3", res);
      }
   ));

   dl.push(session.call('com.arguments.arglen', [1, 2, 3], {a: 1, b: 2, c: 3}).then(
      function (res) {
         console.log("Arglen 4", res);
      }
   ));

   return dl;
}


var connection = new autobahn.Connection({
   url: 'ws://127.0.0.1:8080/ws',
   realm: 'realm1'}
);

connection.onopen = function (session) {

   var pl1 = [];

   for (var uri in endpoints) {
      pl1.push(session.register(uri, endpoints[uri]));
   }

   autobahn.when.all(pl1).then(
      function () {
         console.log("All registered.");

         var pl2 = test1(session);

         autobahn.when.all(pl2).then(function () {
            console.log("All finished.");
            connection.close();
         });
      },
      function () {
         console.log("Registration failed!", arguments);
      }
   );  
};

connection.open();
