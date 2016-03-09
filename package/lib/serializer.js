///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (C) 2011-2016 Tavendo GmbH, http://tavendo.com
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////


function JSONSerializer(replacer, reviver) {
   this.replacer = replacer;
   this.reviver = reviver;
   this.SERIALIZER_ID = 'json';
   this.BINARY = false;
}

JSONSerializer.prototype.serialize = function (obj) {
   return JSON.stringify(obj, this.replacer);
};

JSONSerializer.prototype.unserialize = function (payload) {
   return JSON.parse(payload, this.reviver);
};

exports.JSONSerializer = JSONSerializer;


try {
   var msgpack = require('msgpack-lite');

   function MsgpackSerializer() {
      // https://github.com/mcollina/msgpack5
      this.SERIALIZER_ID = 'msgpack';
      this.BINARY = true;
   }

   MsgpackSerializer.prototype.serialize = function (obj) {
      return msgpack.encode(obj);
   };

   MsgpackSerializer.prototype.unserialize = function (payload) {
      return msgpack.decode(payload);
   };

   exports.MsgpackSerializer = MsgpackSerializer;
} catch (err) {
   // msgpack-lite not installed
}
