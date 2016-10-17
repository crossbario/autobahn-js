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
      this.SERIALIZER_ID = 'msgpack';
      this.BINARY = true;
      this.codec = msgpack.createCodec();
   }

   MsgpackSerializer.prototype.serialize = function (obj) {
      return msgpack.encode(obj, {codec: this.codec});
   };

   MsgpackSerializer.prototype.unserialize = function (payload) {
      // need to encapsulate ArrayBuffer into Uint8Array for msgpack decoding
      return msgpack.decode(new Uint8Array(payload), {codec: this.codec});
   };

   /**
    * Register a packer and/or unpacker functions for a given type.
    *
    * The msgpack specification allows applications to register up to 128 extension
    * types.
    *
    * @param code numeric extension code (between 0-127)
    * @param type constructor for the given type (only required when packer is defined)
    * @param packer a function that takes an object and returns a Buffer
    * @param unpacker a function that takes a Buffer and returns an instance of the given type
    */
   MsgpackSerializer.prototype.registerExtType = function (code, type, packer, unpacker) {
      if (packer && type) {
         this.codec.addExtPacker(code, type, packer);
      }
      if (unpacker) {
         this.codec.addExtUnpacker(code, unpacker);
      }
   };

   exports.MsgpackSerializer = MsgpackSerializer;
} catch (err) {

   exports.MsgpackSerializer = null;
}
