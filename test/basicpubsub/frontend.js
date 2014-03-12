try {
   var autobahn = require('autobahn');
} catch (e) {
   // when running in browser, AutobahnJS will
   // be included without a module system
}

var connection = new autobahn.Connection({
   url: 'ws://127.0.0.1:8080/ws',
   realm: 'realm1'}
);

var session;

var sub1a;
var sub1b;

connection.onopen = function (new_session) {

   session = new_session;

/*
   function foo(a, delay) {
      var d = autobahn.when.defer();

      window.setTimeout(function() {
         d.resolve(a*a);
      }, delay);

      return d.promise;
   }

   var d = foo(2, 2000).then(function (res) {
      console.log(res);
      return "hell0";
   });

   var d2 = d.then(function (res) {
      console.log("fff", res);
      //return res + res;

      var d = autobahn.when.defer();

      window.setTimeout(function() {
         d.resolve(res + res);
      }, 1000);

      return d.promise;
      //sdfsdf;
   });

   d2.then(function (res) {
      console.log("step3", res);
   }, function (err) { console.log(err); });

   var d3 = d.then(function (res) {
      console.log("fff2 ", res);
   });

   autobahn.when.all([d2, d3]).then(function () {
      console.log("done", arguments);
   });

*/


   function onevent1a(args) {
      console.log("onevent1a", args[0]);
   }

   session.subscribe('com.myapp.topic1', onevent1a).then(
      function (sub) {
         sub1a = sub;
   });



   function onevent1b(args) {
      console.log("onevent1b", args[0]);
   }

   session.subscribe('com.myapp.topic1', onevent1b).then(
      function (sub) {
         sub1b = sub;
   });

   window.setTimeout(function () {
      //sub1b.unwatch(onevent1b);
      session.unsubscribe(sub1b).then(session.log);
      console.log("unsubscribed");

   }, 2000);
   
   window.setTimeout(function () {
      //sub1b.unwatch(onevent1b);
      session.unsubscribe(sub1a).then(session.log);
      console.log("unsubscribed");

   }, 4000);
};


/*
var session;
var sub1;

connection.onopen = function (new_session) {

   session = new_session;


   sub1 = session.subscribe('com.myapp.topic1');


   function onevent1a(args) {
      console.log("onevent1a", args[0]);
   }

   sub1.then(function (sub) {
      sub.watch(onevent1a);
   });



   function onevent1b(args) {
      console.log("onevent1b", args[0]);
   }

   sub1.then(function (sub) {
      sub.watch(onevent1b);
   });
};
*/

/*
var session;
var sub_1b;

connection.onopen = function (new_session) {

   session = new_session;

   function onevent1a(args) {
      console.log("onevent1a", args[0]);
   }

   var d = session.subscribe('com.myapp.topic1', onevent1a);


   var received_1b = 0;

   function onevent1b(args) {
      console.log("onevent1b", args[0]);
      received_1b += 1;
      if (received_1b > 2) {
         sub_1b.unwatch(onevent1b);
         console.log("unwatched onevent1b")
      }
   }

   session.subscribe('com.myapp.topic1', onevent1b).then(
      function (sub) {
         console.log(sub);
         sub_1b = sub;
      }
   );


   function onevent1c(args) {
      console.log("onevent1c", args[0]);
   }

   d.then(function (sub) {
      sub.watch(onevent1c);
   })

};
*/

connection.open();
