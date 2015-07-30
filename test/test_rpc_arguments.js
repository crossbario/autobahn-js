///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (C) 2011-2014 Tavendo GmbH, http://tavendo.com
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var autobahn = require('./../index.js');
var testutil = require('./testutil.js');


exports.testRpcArguments = function (testcase) {

   testcase.expect(1);

   var test = new testutil.Testlog("test/test_rpc_arguments.txt");

   var connection = new autobahn.Connection(testutil.config);

   connection.onopen = function (session) {

      test.log('Connected');

      function ping() {
         test.log('ping()')
      }

      function add2(args) {
         test.log('add2()', args);
         return args[0] + args[1];
      }

      function stars(args, kwargs) {
         test.log('stars', args, kwargs);
         kwargs = kwargs || {};
         kwargs.nick = kwargs.nick || "somebody";
         kwargs.stars = kwargs.stars || 0;
         return kwargs.nick + " starred " + kwargs.stars + "x";
      }

      var _orders = [];
      for (var i = 0; i < 50; ++i) _orders.push(i);

      function orders(args, kwargs) {
         test.log('orders()', args, kwargs);
         kwargs = kwargs || {};
         kwargs.limit = kwargs.limit || 5;
         return _orders.slice(0, kwargs.limit);
      }

      function arglen(args, kwargs) {
         test.log('arglen()', args, kwargs);
         args = args || [];
         kwargs = kwargs || {};
         return [args.length, Object.keys(kwargs).length];
      }

      var endpoints = {
         'com.arguments.ping': ping,
         'com.arguments.add2': add2,
         'com.arguments.stars': stars,
         'com.arguments.orders': orders,
         'com.arguments.arglen': arglen
      };

      var pl1 = [];

      for (var uri in endpoints) {
         pl1.push(session.register(uri, endpoints[uri]));
      }

      autobahn.when.all(pl1).then(
         function () {
            test.log("All registered.");

            var pl2 = [];

            pl2.push(session.call('com.arguments.ping').then(
               function () {
                  test.log("Pinged");
               }
            ));

            pl2.push(session.call('com.arguments.add2', [2, 3]).then(
               function (res) {
                  test.log("Add2:", res);
               }
            ));

            pl2.push(session.call('com.arguments.stars').then(
               function (res) {
                  test.log("Starred 1:", res);
               }
            ));

            pl2.push(session.call('com.arguments.stars', [], {nick: 'Homer'}).then(
               function (res) {
                  test.log("Starred 2:", res);
               }
            ));

            pl2.push(session.call('com.arguments.stars', [], {stars: 5}).then(
               function (res) {
                  test.log("Starred 3:", res);
               }
            ));

            pl2.push(session.call('com.arguments.stars', [], {nick: 'Homer', stars: 5}).then(
               function (res) {
                  test.log("Starred 4:", res);
               }
            ));

            pl2.push(session.call('com.arguments.orders', ['coffee']).then(
               function (res) {
                  test.log("Orders 1:", res);
               }
            ));

            pl2.push(session.call('com.arguments.orders', ['coffee'], {limit: 10}).then(
               function (res) {
                  test.log("Orders 2:", res);
               },
               function (err) {
                  test.log(err);
               }
            ));

            pl2.push(session.call('com.arguments.arglen').then(
               function (res) {
                  test.log("Arglen 1", res);
               }
            ));

            pl2.push(session.call('com.arguments.arglen', [1, 2, 3]).then(
               function (res) {
                  test.log("Arglen 2", res);
               }
            ));

            pl2.push(session.call('com.arguments.arglen', [], {a: 1, b: 2, c: 3}).then(
               function (res) {
                  test.log("Arglen 3", res);
               }
            ));

            pl2.push(session.call('com.arguments.arglen', [1, 2, 3], {a: 1, b: 2, c: 3}).then(
               function (res) {
                  test.log("Arglen 4", res);
               }
            ));

            autobahn.when.all(pl2).then(function () {
               test.log("All finished.");
               connection.close();

               var chk = test.check()
               testcase.ok(!chk, chk);
               testcase.done();
            });
         },
         function () {
            test.log("Registration failed!", arguments);
         }
      );  
   };

   connection.open();
}
