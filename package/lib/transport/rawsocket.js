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


var util = require('../util.js');
var log = require('../log.js');

var EventEmitter = require('events').EventEmitter;


function Factory (options) {
   var self = this;

   if (!options.protocols) {
      options.protocols = ['wamp.2.json'];
   } else {
      util.assert(Array.isArray(options.protocols), "options.protocols must be an array");
   }

   options.rawsocket_max_len_exp = options.rawsocket_max_len_exp || 24;

   self._options = options;
}


Factory.prototype.type = "rawsocket";


Factory.prototype.create = function () {

   var self = this;

   // the WAMP transport we create
   var transport = {};

   // these will get defined further below
   transport.protocol = undefined;
   transport.send = undefined;
   transport.close = undefined;

   // these will get overridden by the WAMP session using this transport
   transport.onmessage = function () {};
   transport.onopen = function () {};
   transport.onclose = function () {};

   transport.info = {
      type: 'rawsocket',
      url: null,
      protocol: 'wamp.2.json'
   };


   // Test below used to be via the 'window' object in the browser.
   // This fails when running in a Web worker.
   //
   // running in Node.js
   //
   if (global.process && global.process.versions.node) {

      (function () {
         var net = require('net');
         var socket, protocol;

         // Create the options object to initiate the connection
         if (self._options.path) {
            connectionOptions = {
               path: self._options.path,
               allowHalfOpen: true
            };
         } else if (self._options.port) {
            connectionOptions = {
               port: self._options.port || 8000,
               host: self._options.host || 'localhost',
               allowHalfOpen: true
            };
         } else {
            throw "You must specify a host/port combination or a unix socket path to connect to";
         }

         // Open a TCP socket and setup the protocol
         socket = net.connect(connectionOptions);
         protocol = new Protocol(socket, {
            serializer: 'json',
            max_len_exp: self._options.rawsocket_max_len_exp
         });

         // Relay connect event to the onopen transport handler
         protocol.on('connect', function (msg) {
            log.debug('RawSocket transport negociated');
            transport.onopen(msg);
         });

         // Relay data event to the onmessage transport handler
         protocol.on('data', function (msg) {
            log.debug('RawSocket transport received', msg);
            transport.onmessage(msg);
         });

         // Relay the close event to the onclose transport handler
         protocol.on('close', function (had_error) {
            log.debug('RawSocket transport closed');
            transport.onclose({
               code: 999,
               reason: '',
               wasClean: !had_error
            });
         });

         // Log errors
         protocol.on('error', function (error) {
            log.debug('RawSocket transport error', error);
         });

         // Relay close call
         transport.close = function (code, reason) {
            log.debug('RawSocket transport closing', code, reason);
            protocol.close();
         };

         // Relay send call
         transport.send = function (msg) {
            log.debug('RawSocket transport sending', msg);
            protocol.write(msg);
         };

      })();
   //
   // running in the browser
   //
   } else {
      throw "No RawSocket support in browser";
   }

   return transport;
};

/**
 *  Protocol constructor
 *
 * @param {Stream} stream    Source stream object
 * @param {Object} [options] Protocol options
 *
 * @param {String} [options.serializer] The serializer to use (default: json)
 * @param {Integer} [options.max_len_exp] The maximum allowed frame length as
 *        2^x(default: 24)
 * @param {Integer|False} [options.ping_timeout] Maximum duration in ms to wait
 *        for an answer to a PING packet (default: 2000)
 * @param {Integer|False} [options.autoping] If an integer, send a PING packet*
 *        every `x`ms (default: false)
 * @param {Boolean} [options.fail_on_ping_timeout] Whether to close the
 *        underlying connection when the peer fails to answer to a PING within
 *        the `ping_timeout` window (default: true)
 * @param {Integer|False} [options.packet_timeout] The maximum amount of time to
 *        wait for a packet !!NOT IMPLEMENTED!! (default: 2000)
 *
 * @see https://github.com/wamp-proto/wamp-proto
 */
function Protocol (stream, options) {
   this._options = {
      _peer_serializer: null, // Will hold the serializer declared by the peer
      _peer_max_len_exp: 0    // Will hold the maximum frame length declared by
                              // the peer
   };

   this._options = util.defaults(this._options, options, this.DEFAULT_OPTIONS);

   // Check valid options
   util.assert(this._options.serializer in this.SERIALIZERS,
      'Unsupported serializer: ' + this._options.serializer);

   util.assert(this._options.max_len_exp >= 9 &&
      this._options.max_len_exp <= 36,
      'Message length out of bounds [9, 36]: '+ this._options.max_len_exp);

   util.assert(!this._options.autoping ||
      (Number.isInteger(this._options.autoping) && this._options.autoping >= 0),
      'Autoping interval must be positive');

   util.assert(!this._options.ping_timeout ||
      (Number.isInteger(this._options.ping_timeout) &&
         this._options.ping_timeout >= 0),
      'Ping timeout duration must be positive');

   util.assert(!this._options.packet_timeout ||
      (Number.isInteger(this._options.packet_timeout) &&
         this._options.packet_timeout >= 0),
      'Packet timeout duration must be positive');

   util.assert((!this._options.autoping || !this._options.ping_timeout) ||
      this._options.autoping > this._options.ping_timeout,
      'Autoping interval (' + this._options.autoping + ') must be lower ' +
      'than ping timeout (' + this._options.ping_timeout + ')');

   // Will store a reference to the timeout function associated with the last
   // PING packet
   this._ping_timeout = null;

   // Will store the payload of the last PING packet
   this._ping_payload = null;

   // Will store the autoping setInterval reference
   this._ping_interval = null;

   // Protocol status (see Protocol.prototype.STATUS)
   this._status = this.STATUS.UNINITIATED;

   this._stream = stream;
   this._emitter = new EventEmitter();

   // Frame buffer
   this._buffer = new Buffer(4);
   this._bufferLen = 0;
   this._msgLen = 0;

   // Hook events
   var self = this;
   this._stream.on('data', function (data) {
      self._read(data);
   });

   this._stream.on('connect', function () {
      self._handshake();
   });

   // Proxy these events from the stream as we don't need to handle them
   var proxyEvents = [
      'close',
      'drain',
      'end',
      'error',
      'timeout'
   ];
   proxyEvents.forEach(function (evt) {
      self._stream.on(evt, function (data) {
         self._emitter.emit(evt, data);
      });
   });
}

/* Protocol magic byte */
Protocol.prototype._MAGIC_BYTE = 0x7f;

/* Supported serializers */
Protocol.prototype.SERIALIZERS = {
   json: 1
};

/* Protocol states */
Protocol.prototype.STATUS = {
   CLOSED:     -1,
   UNINITIATED: 0,
   NEGOCIATING: 1,
   NEGOCIATED:  2,
   RXHEAD:      3,
   RXDATA:      4,
   RXPING:      5,
   RXPONG:      6
};

/* RawSocket error codes */
Protocol.prototype.ERRORS = {
   0: "illegal (must not be used)",
   1: "serializer unsupported",
   2: "maximum message length unacceptable",
   3: "use of reserved bits (unsupported feature)",
   4: "maximum connection count reached"
};

/* RawSocket message types */
Protocol.prototype.MSGTYPES = {
   WAMP: 0x0,
   PING: 0x1,
   PONG: 0x2
};

/* Default protocol options */
Protocol.prototype.DEFAULT_OPTIONS = {
   fail_on_ping_timeout: true,
   strict_pong: true,
   ping_timeout: 2000,
   autoping: 0,
   max_len_exp: 24,
   serializer: 'json',
   packet_timeout: 2000
};

/**
 * Close transport
 *
 * @returns {Integer} Closed state code
 */
Protocol.prototype.close = function () {
   this._status = this.STATUS.CLOSED;
   this._stream.end();

   return this.STATUS.CLOSED;
};

/**
 * Write a frame to the transport
 *
 * @param   {Oject}    msg      The frame to send
 * @param   {Integer}  type     The frame type
 * @param   {Function} callback Callback function called when frame is sent
 */
Protocol.prototype.write = function (msg, type, callback) {
   type = type === undefined ? 0 : type;

   // If WAMP frame, serialize the object passed
   // Otherwise send as-is
   if (type === this.MSGTYPES.WAMP) {
      msg = JSON.stringify(msg);
   }

   // Get the frame size
   var msgLen = Buffer.byteLength(msg, 'utf8');

   // Check frame size against negociated max size
   if (msgLen > Math.pow(2, this._options._peer_max_len_exp)) {
      this._emitter.emit('error', new ProtocolError('Frame too big'));
      return;
   }

   // Create the frame
   var frame = new Buffer(msgLen + 4);

   // Message type
   frame.writeUInt8(type, 0);
   // Prefix by frame size as a 24 bit integer
   frame.writeUIntBE(msgLen, 1, 3);
   frame.write(msg, 4);

   this._stream.write(frame, callback);
};

Protocol.prototype.ping = function (payload) {
   payload = payload || 255;

   // Generate a random payload if none provided
   if (Number.isInteger(payload)) {
      var base = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'+
                 '0123456789&~"#\'{([-|`_\\^@)]=},?;.:/!*$<>';
      var len = Math.max(1, payload);

      for (var i = 0; i < len; i++)
         payload += base.charAt((Math.random() * base.length) | 0);
   }

   // Store the payload for checking against PONG packet
   this._ping_payload = payload;

   // Send the packet and register the ping timeout once done
   return this.write(payload, this.MSGTYPES.PING, this._setupPingTimeout.bind(this));
};

Protocol.prototype._setupPingTimeout = function () {
   if (this._options.ping_timeout) {
      this._ping_timeout = setTimeout(this._onPingTimeout.bind(this), this._options.ping_timeout);
   }
};

Protocol.prototype._clearPingTimeout = function () {
   if (this._ping_timeout) {
      clearTimeout(this._ping_timeout);
      this._ping_timeout = null;
   }
};

Protocol.prototype._setupAutoPing = function () {
   this._clearAutoPing();

   if (this._options.autoping) {
      this._autoping_interval = setInterval(this.ping.bind(this), this._options.autoping);
   }
};

Protocol.prototype._clearAutoPing = function () {
   if (this._autoping_interval) {
      clearInterval(this._autoping_interval);
      this._autoping_interval = null;
   }
};

Protocol.prototype._onPingTimeout = function () {
   this._emitter.emit('error', new ProtocolError('PING timeout'));

   if (this._options.fail_on_ping_timeout) {
      this.close();
   }
};

/**
 * Handle incoming data
 *
 * @param {Buffer} data Incoming data
 */
Protocol.prototype._read = function (data) {
   var handler, frame;

   switch (this._status) {
      case this.STATUS.CLOSED:
      case this.STATUS.UNINITIATED:
         this._emitter.emit('error', ProtocolError('Unexpected packet'));
         break;

      case this.STATUS.NEGOCIATING:
         handler = this._handleHandshake;
         frame = 4;
         break;

      case this.STATUS.NEGOCIATED:
      case this.STATUS.RXHEAD:
         this._status = this.STATUS.RXHEAD;

         handler = this._handleHeaderPacket;
         frame = 4;
         break;

      case this.STATUS.RXDATA:
         handler = this._handleDataPacket;
         frame = this._msgLen;
         break;

      case this.STATUS.RXPING:
         handler = this._handlePingPacket;
         frame = this._msgLen;
         break;

      case this.STATUS.RXPONG:
         handler = this._handlePongPacket;
         frame = this._msgLen;
         break;
   }

   // Get a frame of the expected size
   var chunks = this._splitBytes(data, frame);

   // Protocol#_splitBytes returns null if there isn't enough data to fill the
   // requested frame yet. Wait for more
   if (!chunks) return;

   // Call the packet handler with the frame
   this._status = handler.call(this, chunks[0]);

   // If there is more data, handle it
   if (chunks[1].length > 0) {
      this._read(chunks[1]);
   }
};

/**
 * Send the handshake packet to the peer
 */
Protocol.prototype._handshake = function () {
   if (this._status !== this.STATUS.UNINITIATED) {
      throw 'Handshake packet already sent';
   }

   // Compose handshake message
   var gday = new Buffer(4);

   // Protocol magic byte
   gday.writeUInt8(this._MAGIC_BYTE, 0);
   // Announce message max length and serializer
   gday.writeUInt8((this._options.max_len_exp - 9) << 4 | this.SERIALIZERS[this._options.serializer], 1);
   // Reserved bytes
   gday.writeUInt8(0x00, 2);
   gday.writeUInt8(0x00, 3);

   this._stream.write(gday);

   this._status = this.STATUS.NEGOCIATING;
};

/**
 * Make a frame of the requested length using the data already buffered and the
 * passed incoming data
 *
 * @param   {Buffer}  data Incoming data
 * @param   {Integer} len  Frame size
 *
 * @returns {null|Array(2)} Returns null if there is'nt enough data to fill the
 *                          frame yet, or an array containing the frame at
 *                          index 0 and the leftover bytes at index 1 otherwise.
 */
Protocol.prototype._splitBytes = function (data, len) {
   // If the buffer we have already isn't the right size, throw the data away
   // and make a new one
   if (len !== this._buffer.length) {
      this._buffer = new Buffer(len);
      this._bufferLen = 0;
   }

   // Push the data to the buffer
   data.copy(this._buffer, this._bufferLen);

   // If there still isn't enough data, increment the counter and return null
   if (this._bufferLen + data.length < len) {
      this._bufferLen += data.length;
      return null;
   // Otherwise, return the requested frame and the leftover data
   } else {
      var bytes = this._buffer.slice();
      var extra = data.slice(len - this._bufferLen);

      this._bufferLen = 0;

      return [ bytes, extra ];
   }
};

/**
 * Handle the handshake response packet
 *
 * @param   {Buffer} int32 A 4 byte buffer containing the handshake packet
 *
 * @returns {Integer} The new protocol state
 */
Protocol.prototype._handleHandshake = function (int32) {
   // Check magic byte
   if (int32[0] !== this._MAGIC_BYTE) {
      this._emitter.emit('error',  new ProtocolError(
         'Invalid magic byte. Expected 0x' +
         this._MAGIC_BYTE.toString(16) + ', got 0x' +
         int32[0].toString(16))
      );
      return this.close();
   }

   // Check for error
   if ((int32[1] & 0x0f) === 0) {
      var errcode = int32[1] >> 4;
      this._emitter.emit('error',  new ProtocolError('Peer failed handshake: ' +
         (this.ERRORS[errcode] || '0x' + errcode.toString(16))));
      return this.close();
   }

   // Extract max message length and serializer
   this._options._peer_max_len_exp = (int32[1] >> 4) + 9;
   this._options._peer_serializer = int32[1] & 0x0f;

   // We only support JSON so far
   // TODO: Support more serializers
   if (this._options._peer_serializer !== this.SERIALIZERS.json) {
      this._emitter.emit('error', new ProtocolError(
         'Unsupported serializer: 0x' +
         this._options._peer_serializer.toString(16))
      );
      return this.close();
   }

   // Protocol negociation complete, we're connected to the peer and ready to
   // talk
   this._emitter.emit('connect');

   // Setup the autoping
   this._setupAutoPing();

   return this.STATUS.NEGOCIATED;
};

/**
 * Handle a frame header
 *
 * @param   {Buffer} int32 A 4 byte buffer representing the packet length
 *
 * @returns {Integer} The new protocol state
 */
Protocol.prototype._handleHeaderPacket = function (int32) {
   var type = int32[0] & 0x0f;

   // Decode integer and store it
   this._msgLen = int32.readUIntBE(1, 3);

   switch (type) {
      case this.MSGTYPES.WAMP: // WAMP frame
         return this.STATUS.RXDATA;

      case this.MSGTYPES.PING: // PING frame
         return this.STATUS.RXPING;

      case this.MSGTYPES.PONG: // PONG frame
         return this.STATUS.RXPONG;

      default:
         this._emitter.emit('error', new ProtocolError(
            'Invalid frame type: 0x' + type.toString(16))
         );
         return this.close();
   }
};

/**
 * Handle a data packet
 *
 * @param   {Buffer} buffer The received data
 *
 * @returns {Integer} The new protocol state
 */
Protocol.prototype._handleDataPacket = function (buffer) {
   var msg;
   // Attempt to deserialize the frame
   // TODO: Support other serializers
   try {
      msg = JSON.parse(buffer.toString('utf8'));
   } catch (e) {
      this._emitter.emit('error',
         new ProtocolError('Invalid JSON frame')
      );
      return this.STATUS.RXHEAD;
   }

   // Emit a data event for consumers
   this._emitter.emit('data', msg);

   return this.STATUS.RXHEAD;
};

/**
 * Handle a ping packet - Reply with a  PONG and the same payload
 *
 * @param   {Buffer} buffer The received data
 *
 * @returns {Integer} The new protocol state
 */
Protocol.prototype._handlePingPacket = function (buffer) {
   this.write(buffer.toString('utf8'), this.MSGTYPES.PONG);
   return this.STATUS.RXHEAD;
};

/**
 * Handle a pong packet
 *
 * @param   {Buffer} buffer The received data
 *
 * @returns {Integer} The new protocol state
 */
Protocol.prototype._handlePongPacket = function (buffer) {
   // Clear the ping timeout (if any)
   this._clearPingTimeout();

   // If strict PONG checking is activated and the payloads don't match, throw
   // an error and close the connection
   if (this._options.strict_pong
      && this._ping_payload !== buffer.toString('utf8')) {
      this._emitter.emit('error', new ProtocolError(
         'PONG response payload doesn\'t match PING.'
      ));

      return this.close();
   }

   return this.STATUS.RXHEAD;
};

Protocol.prototype.on = function (evt, handler) {
   return this._emitter.on(evt, handler);
};

Protocol.prototype.once = function (evt, handler) {
   return this._emitter.once(evt, handler);
};

Protocol.prototype.removeListener = function (evt, handler) {
   return this._emitter.removeListener(evt, handler);
};


/**
 * ProtocolError type
 */
var ProtocolError = exports.ProtocolError = function (msg) {
   Error.apply(this, Array.prototype.splice.call(arguments));

   Error.captureStackTrace(this, this.constructor);

   this.message = msg;
   this.name = 'ProtocolError';
};
ProtocolError.prototype = Object.create(Error.prototype);


exports.Factory = Factory;
exports.Protocol = Protocol;
