var when = require('when');
var websocket = require('./websocket.js');
var global = this;

function newid() {
   return Math.floor(Math.random() * 9007199254740992);
}

var MSG_TYPE = {
   HELLO: 1,
   GOODBYE: 2,
   HEARTBEAT: 3,
   ERROR: 4,
   PUBLISH: 16,
   PUBLISHED: 17,
   SUBSCRIBE: 32,
   SUBSCRIBED: 33,
   UNSUBSCRIBE: 34,
   UNSUBSCRIBED: 35,
   EVENT: 36,
   CALL: 48,
   CANCEL: 49,
   RESULT: 50,
   REGISTER: 64,
   REGISTERED: 65,
   UNREGISTER: 66,
   UNREGISTERED: 67,
   INVOCATION: 68,
   INTERRUPT: 69,
   YIELD: 70
};

WAMP_FEATURES = {
   roles: {
      caller: {},
      callee: {},
      publisher: {},
      subscriber: {}
   }
};


var Session = function (options) {

   var self = this;
   self._socket = null;

   self._my_session_id = null;
   self._peer_session_id = null;

   self._goodbye_sent = false;
   self._transport_is_closing = false;

   // outstanding requests;
   self._publish_reqs = {};
   self._subscribe_reqs = {};
   self._unsubscribe_reqs = {};
   self._call_reqs = {};
   self._register_reqs = {};
   self._unregister_reqs = {};

   // subscriptions in place;
   self._subscriptions = {};

   // registrations in place;
   self._registrations = {};

   // incoming invocations;
   self._invocations = {};

   self.onopen = null;
};

Session.prototype.connect = function (transport) {

   var self = this;
   self._socket = transport;

   self._send_wamp = function (msg) {
      self._socket.send(JSON.stringify(msg));
   };

   self._socket.onmessage = function (evt) {
      //console.log(evt.data, "***");
      //this.close();
      var msg = JSON.parse(evt.data);
      //console.log(msg);

      var msg_type = msg[0];

      if (!self._peer_session_id) {

         if (msg_type === MSG_TYPE.HELLO) {

            self._peer_session_id = msg[1];
            if (self.onopen) self.onopen();

         } else {
            // FAIL
            console.log("FAIL");
         }
      } else {

         if (msg_type === MSG_TYPE.HELLO) {
            // FAIL
            console.log("FAIL");
         } else if (msg_type === MSG_TYPE.RESULT) {
            var request = msg[1];
            var details = msg[2];
            var result = null;
            if (msg.length > 3) {
               if (msg.length > 4 || msg[3].length > 1) {
                  // complex result
               } else {
                  result = msg[3][0];
               }
            }
            if (request in self._call_reqs) {
               self._call_reqs[request].resolve(result);
            }
         } else {
            console.log("not implemented");
         }
      }
   };

   self._socket.onopen = function () {
      console.log("connected!");

      self._my_session_id = newid();
      var msg = [MSG_TYPE.HELLO, self._my_session_id, WAMP_FEATURES];
      self._send_wamp(msg);
   };

   self._socket.onclose = function (evt) {
      console.log(evt.reason);
   };
};


Session.prototype.call = function (procedure, pargs, kwargs, options) {
   var self = this;

   var d = when.defer();
   var id = newid();

   self._call_reqs[id] = d;

   var msg = [MSG_TYPE.CALL, id];
   if (options) {
      msg.push(options);
   } else {
      msg.push({});
   }
   msg.push(procedure);
   if (pargs) {
      msg.push(pargs);
      if (kwargs) {
         msg.push(kwargs);
      }
   }
   self._send_wamp(msg);

   return d.promise;
};


Session.prototype.subscribe = function (handler, topic, options) {
   var self = this;

   var request = newid();
   var d = when.defer();
   self._subscribe_reqs[request] = [d, handler, options];

   var msg = [MSG_TYPE.SUBSCRIBE, request];
   if (options) {
      msg.push(options);
   } else {
      msg.push({});
   }
   msg.push(topic);

   self._send_wamp(msg);

   return d.promise;
};


exports.Session = Session;