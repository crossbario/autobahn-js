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


// generate a WAMP ID: this might be serializer specific, as
// we need to enforce encoding into an integer, not float
// eg we need to do some extra stuff for msgpack (json and
// cbor are fine "as is")
function newid () {
   return Math.floor(Math.random() * 9007199254740992);
}


function JSONSerializer(replacer, reviver) {
   this.replacer = replacer;
   this.reviver = reviver;
   this.SERIALIZER_ID = 'json';
   this.BINARY = false;

   // JSON encoder does not need anything special here
   this.newid = newid;
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


// https://github.com/kawanet/msgpack-lite/
// https://github.com/kawanet/int64-buffer
var msgpack = require('msgpack-lite');

// this is needed for correct msgpack serialization of WAMP session IDs
var Uint64BE = require('int64-buffer').Uint64BE;

function MsgpackSerializer() {
   this.SERIALIZER_ID = 'msgpack';
   this.BINARY = true;
   this.codec = msgpack.createCodec();

   // msgpack: Uint64BE ensures that ID is encoded as int instead of double
   this.newid = function () { return new Uint64BE(newid()); };
}

MsgpackSerializer.prototype.serialize = function (obj) {
   try {
      var payload = msgpack.encode(obj, {codec: this.codec});
      return payload;
   } catch (e) {
      log.warn('MessagePack encoding error', e);
      throw e;
   }
};

MsgpackSerializer.prototype.unserialize = function (payload) {
   try {
      // need to encapsulate ArrayBuffer into Uint8Array for msgpack decoding
      // https://github.com/kawanet/msgpack-lite/issues/44
      var obj = msgpack.decode(new Uint8Array(payload), {codec: this.codec});
      return obj;
   } catch (e) {
      log.warn('MessagePack decoding error', e);
      throw e;
   }
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


// http://hildjj.github.io/node-cbor/
var cbor = require('cbor');

function CBORSerializer() {
   this.SERIALIZER_ID = 'cbor';
   this.BINARY = true;

   // CBOR encoder does not need anything special here
   this.newid = newid;
}

CBORSerializer.prototype.serialize = function (obj) {
   try {
      var payload = cbor.encode(obj);
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
