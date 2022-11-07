///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (c) Crossbar.io Technologies GmbH and contributors
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var log = require('./log.js');


function JSONSerializer(replacer, reviver) {
   this.replacer = replacer;
   this.reviver = reviver;
   this.SERIALIZER_ID = 'json';
   this.BINARY = false;
}

JSONSerializer.prototype.serialize = function (obj) {
   try {
      var payload = JSON.stringify(obj, this.replacer);
      return payload;
   } catch (e) {
      log.warn('JSON encoding error', e);
      throw e;
   }
};

JSONSerializer.prototype.unserialize = function (payload) {
   try {
      var obj = JSON.parse(payload, this.reviver);
      return obj;
   } catch (e) {
      log.warn('JSON decoding error', e);
      throw e;
   }
};

exports.JSONSerializer = JSONSerializer;


try {
   // https://github.com/mcollina/msgpack5
   var msgpack = require('msgpack5')({forceFloat64: true});

   function MsgpackSerializer() {
      this.SERIALIZER_ID = 'msgpack';
      this.BINARY = true;
   }

   MsgpackSerializer.prototype.serialize = function (obj) {
      try {
         var payload = msgpack.encode(obj);
         return payload;
      } catch (e) {
         log.warn('MessagePack encoding error', e);
         throw e;
      }
   };

   MsgpackSerializer.prototype.unserialize = function (payload) {
      try {
         var obj = msgpack.decode(payload);
         return obj;
      } catch (e) {
         log.warn('MessagePack decoding error', e);
         throw e;
      }
   };

   exports.MsgpackSerializer = MsgpackSerializer;
} catch (e) {
   log.warn('msgpack serializer not available', e);
}


try {
   // http://hildjj.github.io/node-cbor/
   var cbor = require('cbor');

   function CBORSerializer() {
      this.SERIALIZER_ID = 'cbor';
      this.BINARY = true;
   }

   CBORSerializer.prototype.serialize = async function (obj) {
      try {
         var payload = await cbor.encodeAsync(obj);
         return payload;
      } catch (e) {
         log.warn('CBOR encoding error', e);
         throw e;
      }
   };

   CBORSerializer.prototype.unserialize = function (payload) {
      try {
         //var obj = cbor.decodeAllSync(payload)[0];
         var obj = cbor.decodeFirstSync(payload);
         return obj;
      } catch (e) {
         log.warn('CBOR decoding error', e);
         throw e;
      }
   };

   exports.CBORSerializer = CBORSerializer;
} catch (e) {
   log.warn('cbor serializer not available', e);
}
