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


// https://github.com/mcollina/msgpack5
var msgpack = require('msgpack5')({forceFloat64: true});

function MsgpackSerializer() {
   this.SERIALIZER_ID = 'msgpack';
   this.BINARY = true;

   this.newid = newid;
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
