var stream = require('stream');
var rawsocket = require('./../lib/transport/rawsocket.js');


/**
 * The protocol must handle a valid handshake exchange
 */
module.exports = {
   testValidHandshake: function (testcase) {
      // Make a X wire: what is written on wire.tx will be read by wire.rx and
      // vice-versa
      var wire = makeXWire();

      testcase.expect(3);

      var machine = new StateMachine({
         // Mock connection opening and wait for handshake
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },

         // Check handshake packet validity
         waitForHandshake: function (handshake) {
            testcase.equal(handshake.length, 4, 'Handshake should be 4 bytes');
            testcase.equal(handshake[0], 0x7f, 'Magic byte must be 0x7f');
            testcase.ok([ 0x1, 0x2 ].indexOf(handshake[1] & 0xf) > -1, 'Must announce a valid serializer');

            // Send a valid handshake reply
            replyWithValidHandshake(wire.tx, 'wait')();

            // Wait a bit then declare the test done
            setTimeout(function () {
               testcase.done();
            }, 50);
         },
         wait: function () {},
      });

      // Init the protocol
      var protocol = new rawsocket.Protocol(wire.rx);

      // When data is received by the tx wire, send it to the state machine
      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

      // Ensure we don't throw
      // Ensure we don't throw
      protocol.on('error', function (err) {
         testcase.ok(false, 'Should not throw a protocol error');

         testcase.done();
      });

      // Start the state machine
      machine.tick();
   },

   /**
    * The protocol must throw a ProtocolError when the server replies with a failed
    * handshake message
    */
   testFailedHandshake: function (testcase) {
      // Make a X wire: what is written on wire.tx will be read by wire.rx and
      // vice-versa
      var wire = makeXWire();

      testcase.expect(1);

      var machine = new StateMachine({
         // Mock connection opening and wait for handshake
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },

         // Reply with an invalid handshake
         waitForHandshake: function (handshake) {
            setTimeout(function () {
               // Invalid handshake reply
               var howdy = new Buffer(4);
               howdy.writeUInt8(0x7f, 0);
               howdy.writeUInt8(0x10, 1); // Unsupported serializer error
               howdy.writeUInt8(0x00, 2);
               howdy.writeUInt8(0x00, 3);

               wire.tx.write(howdy);
            }, 10);
         },
      });

      // Init the protocol
      var protocol = new rawsocket.Protocol(wire.rx);

      // When data is received by the tx wire, send it to the state machine
      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

      // Ensure we DO throw since we declared an incvalid serializer
      protocol.on('error', function (err) {
         testcase.ok(err instanceof rawsocket.ProtocolError, 'Should throw a protocol error');

         testcase.done();
      });

      machine.tick();
   },

   /**
    * The protocol should reply to PING packets with a PONG packet with the same
    * payload
    **/
   testPingReply: function (testcase) {
      // Make a X wire: what is written on wire.tx will be read by wire.rx and
      // vice-versa
      var wire = makeXWire();

      testcase.expect(4);

      // Generate a random payload
      var payload = randomString(256);

      var machine = new StateMachine({
         // Mock connection opening and wait for handshake
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },
         // Reply with a valid handshake
         waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),

         // Send a ping to Autobahn
         sendPing: function () {
            setTimeout(function () {
               var frame = buildRawSocketFrame(0x01, payload);

               machine.transition('waitPong');

               wire.tx.write(frame);
            }, 10);
         },

         // Test the PONG answer
         waitPong: function (packet) {
            // First half-byte reserved and zeroed
            testcase.equal(packet[0] >> 4, 0, 'Reserved half-byte must be zeroed');
            // Second half-byte must indicate a PONG packet (0x2)
            testcase.equal(packet[0] & 0x0f, 0x2, 'Expected a PONG packet');
            // Check length
            testcase.equal(packet.readUIntBE(1, 3), packet.length - 4, 'Length prefix doesn\'t match frame length');
            // Check payload
            testcase.equal(packet.toString('utf8', 4), payload, 'PONG reply must have the same payload as the PING packet');

            testcase.done();
         },
      });


      // Init the protocol
      var protocol = new rawsocket.Protocol(wire.rx);

      // When data is received by the tx wire, send it to the state machine
      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

      // Ensure we don't throw
      protocol.on('error', function (err) {
         testcase.ok(false, 'Should not throw a protocol error');

         testcase.done();
      });

      machine.tick();
   },

   /**
    * The protocol should accept a PONG packet with the same payload
    **/
   testPingRequest: function (testcase) {
      // Make a X wire: what is written on wire.tx will be read by wire.rx and
      // vice-versa
      var wire = makeXWire();

      testcase.expect(3);

      var machine = new StateMachine({
         // Mock connection opening and wait for handshake
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },

         // Reply with a valid handshake
         waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),

         // Send a ping from autobahn
         sendPing: function () {
            setTimeout(function () {
               machine.transition('waitPing');

               protocol.ping();
            }, 10);
         },

         // Check the ping packet
         waitPing: function (packet) {
            // First half-byte reserved and zeroed
            testcase.equal(packet[0] >> 4, 0, 'Reserved half-byte must be zeroed');
            // Second half-byte must indicate a PING packet (0x1)
            testcase.equal(packet[0] & 0x0f, 0x1, 'Expected a PING packet');
            // Check length
            testcase.equal(packet.readUIntBE(1, 3), packet.length - 4, 'Length prefix doesn\'t match frame length');

            // Reply with a PONG packet using the same payload
            setTimeout(function () {
               machine.transition('wait');
               var frame = buildRawSocketFrame(0x2, packet.toString('utf8', 4));

               wire.tx.write(frame);
            }, 10);

            // Declare test done 10ms after the ping timeout delay
            setTimeout(function () {
               testcase.done();
            }, protocol._options.ping_timeout + 10);

            machine.transition('wait');
         },
         wait: function () {},
      });

      // Init the protocol and set a low timeout for testing
      var protocol = new rawsocket.Protocol(wire.rx, {
         strict_pong: true,
         ping_timeout: 20,
      });

      // When data is received by the tx wire, send it to the state machine
      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

      // Ensure we don't throw
      protocol.on('error', function (err) {
         testcase.ok(false, 'Should not throw a protocol error');

         testcase.done();
      });

      machine.tick();
   },

   /**
    * The protocol should choke on a PONG packet with an unmatching payload
    **/
   testInvalidPong: function (testcase) {
      // Make a X wire: what is written on wire.tx will be read by wire.rx and
      // vice-versa
      var wire = makeXWire();

      testcase.expect(1);

      var machine = new StateMachine({
         // Mock connection opening and wait for handshake
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },

         // Reply with valid handshake
         waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),

         // Send a ping from Autobahn
         sendPing: function () {
            setTimeout(function () {
               machine.transition('waitPing');

               protocol.ping();
            }, 10);
         },

         // Reply to the PING with an invalid payload
         waitPing: function (packet) {
            setTimeout(function () {
               machine.transition('wait');
               var frame = buildRawSocketFrame(0x2, packet.toString('utf8', 'This is not supposed to be the same payload'));

               wire.tx.write(frame);
            }, 10);

            machine.transition('wait');
         },
         wait: function () {},
      });

      // Init the protocol with a low timeout for testing and using strict pong
      // checking
      var protocol = new rawsocket.Protocol(wire.rx, {
         strict_pong: true,
         ping_timeout: 20,
      });

      // When data is received by the tx wire, send it to the state machine
      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

      // Ensure we DO throw since the payload don't match and we use strict_pong
      protocol.on('error', function (err) {
         testcase.ok(err instanceof rawsocket.ProtocolError, 'Should throw a protocol error');

         testcase.done();
      });

      machine.tick();
   },

   /**
    * The protocol should throw an error if PING not answered
    **/
   testPingTimeout: function (testcase) {
      // Make a X wire: what is written on wire.tx will be read by wire.rx and
      // vice-versa
      var wire = makeXWire();

      testcase.expect(1);

      var machine = new StateMachine({
         // Mock connection opening and wait for handshake
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },

         // Reply with a valid handshake
         waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),

         // Send a ping from Autobahn
         sendPing: function () {
            setTimeout(function () {
               machine.transition('wait');

               protocol.ping();
            }, 10);
         },
         wait: function () {},
      });

      // Init protocol with a low timeout for testing
      var protocol = new rawsocket.Protocol(wire.rx, {
         strict_pong: true,
         ping_timeout: 20,
      });

      // When data is received by the tx wire, send it to the state machine
      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

      // Ensure we DO throw since we didn't reply to the PING
      protocol.on('error', function (err) {
         testcase.ok(err instanceof rawsocket.ProtocolError, 'Should throw a protocol error');

         testcase.done();
      });

      machine.tick();
   },

   /**
    * The protocol should receive JSON frames
    **/
   testDataReceive: function (testcase) {
      // Make a X wire: what is written on wire.tx will be read by wire.rx and
      // vice-versa
      var wire = makeXWire();

      testcase.expect(1);

      // This is the object we're trying to send
      var obj = [ 1, null, [ true, false ], [ -21, 0.6666 ], { a: 'hello', b: [ 'jamie', 'nicole' ] } ];

      var machine = new StateMachine({
         // Mock connection opening and wait for handshake
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },

         // Reply with a valid handshake
         waitForHandshake: replyWithValidHandshake(wire.tx, 'sendData'),

         // Send a data frame to autobahn
         sendData: function () {
            setTimeout(function () {
               machine.transition('wait');

               // Serialize the object and build a frame
               var frame = buildRawSocketFrame(0x0, JSON.stringify(obj));

               wire.tx.write(frame);
            }, 10);
         },
         wait: function () {},
      });

      // Init protocol
      var protocol = new rawsocket.Protocol(wire.rx);

      // When data is received by the tx wire, send it to the state machine
      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

      // Ensure we don't throw
      protocol.on('error', function (err) {
         testcase.ok(false, 'Should not throw a protocol error');

         testcase.done();
      });

      // Test whether the protocol yields the coirrect object
      protocol.on('data', function (data) {
         testcase.deepEqual(data, obj, 'Received frame doesn\'t match original data');
         testcase.done();
      });

      machine.tick();
   },

   /**
    * The protocol should send JSON frames
    **/
   testDataSend: function (testcase) {
      // Make a X wire: what is written on wire.tx will be read by wire.rx and
      // vice-versa
      var wire = makeXWire();

      testcase.expect(5);

      // This is the object we're trying to send
      var obj = [ 1, null, [ true, false ], [ -21, 0.6666 ], { a: 'hello', b: [ 'jamie', 'nicole' ] } ];

      var machine = new StateMachine({
         // Mock connection opening and wait for handshake
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },

         // Rerply with valid handshake
         waitForHandshake: replyWithValidHandshake(wire.tx, 'sendData'),

         // Send the object with autobahn
         sendData: function () {
            setTimeout(function () {
               machine.transition('receiveData');

               protocol.write(obj);
            }, 10);
         },

         // Check the transmitted frame
         receiveData: function (frame) {
            testcase.equal(frame[0] >> 4, 0x0, 'Reserved half-byte must be zeroed');
            testcase.equal(frame[0] & 0xf, 0x0, 'Frame type must be WAMP');
            testcase.equal(frame.readUIntBE(1, 3), frame.length - 4, 'Unexpected payload size');

            // Make object from frame
            var payload = frame.toString('utf8', 4);
            testcase.doesNotThrow(function () {
               payload = JSON.parse(payload);
            }, 'Invalid JSON');

            // Compare with source
            testcase.deepEqual(payload, obj, 'Sent object does\'nt match');

            testcase.done();
         },
      });

      // Init protocol
      var protocol = new rawsocket.Protocol(wire.rx);

      // When data is received by the tx wire, send it to the state machine
      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

      // Ensure we don't throw
      protocol.on('error', function (err) {
         testcase.ok(false, 'Should not throw a protocol error');

         testcase.done();
      });

      machine.tick();
   },

   /**
    * The protocol should handle chuncked requests
    **/
   testChunkedData: function (testcase) {
      // Make a X wire: what is written on wire.tx will be read by wire.rx and
      // vice-versa
      var wire = makeXWire();

      testcase.expect(1);

      // This is the object we're trying to send
      var obj = [ 1, null, [ true, false ], [ -21, 0.6666 ], { a: 'hello', b: [ 'jamie', 'nicole' ] } ];

      var machine = new StateMachine({
         // Mock connection opening and wait for handshake
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },

         // Reply with valid handshake
         waitForHandshake: replyWithValidHandshake(wire.tx, 'sendData'),
         sendData: function () {
            this.transition('wait');

            var frame = buildRawSocketFrame(0x0, JSON.stringify(obj));

            // Helper to send a chunk of the frame
            function sendChunk (start, end) {
               wire.tx.write(frame.slice(start, end));
            }

            // Send frame one byte at a time with 2ms interval
            for (var i = 0; i < frame.length; i++) {
               setTimeout(sendChunk, i * 2, i, i + 1);
            }
         },
         wait: function () {},
      });


      // Init the protocol
      var protocol = new rawsocket.Protocol(wire.rx);

      // When data is received by the tx wire, send it to the state machine
      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

      // Ensure we don't throw
      protocol.on('error', function (err) {
         testcase.ok(false, 'Should not throw a protocol error');

         testcase.done();
      });

      // Check whether the protocol yields the correct object
      protocol.on('data', function (data) {
         testcase.deepEqual(data, obj, 'Received object doesn\'t match');
         testcase.done();
      });

      machine.tick();
   },
};


// Display swallowed errors for debug
process.on('uncaughtException', function(err) {
  console.error(err.stack);
});


/**
 * Basic network connection mocking
 * Creates a pair of PassThrough streams and swap their write functions
 */
function makeXWire () {
   // We use 2 pass-through streams (i.e. they emit what's written on them)
   var rx = new stream.PassThrough();
   var tx = new stream.PassThrough();

   // Store a bound reference to their original write functions
   rx.__write = rx.write.bind(rx);
   tx.__write = tx.write.bind(tx);

   // Swap the write functions, hence what is written on rx will be emitted by
   // tx, and vice-versa
   rx.write = tx.__write;
   tx.write = rx.__write;

   // Register a close function that emits the 'close' event on both streams
   var close = function () {
      rx.emit('close');
      tx.emit('close');
   };

   rx.close = close;
   tx.close = close;

   // Return the object
   return {
      rx: rx,
      tx: tx,
   };
}

/**
 * Creates a function that returns a function that will write a valid handshake
 * reply to `connection` after `delay` and that calls
 *     this.transition(transitionTo)
 * This is a helper for use with the StateMachine object to facilitate RawSocket
 * protocol testing.
 */
function replyWithValidHandshake (connection, transitionTo, delay) {
   return function () {
      var self = this;
      setTimeout(function () {
         var howdy = new Buffer(4);
         howdy.writeUInt8(0x7f, 0);
         howdy.writeUInt8(0xf1, 1);
         howdy.writeUInt8(0x00, 2);
         howdy.writeUInt8(0x00, 3);

         transitionTo && self.transition && self.transition(transitionTo);

         connection.write(howdy);

         transitionTo && self.tick && self.tick();
      }, delay || 10);
   };
}

/**
 * Create a RawSocket frame of a given `type` and `payload`
 */
function buildRawSocketFrame (type, payload) {
   // Get the frame size
   var msgLen = Buffer.byteLength(payload, 'utf8');

   // Create the frame
   var frame = new Buffer(msgLen + 4);

   // Message type
   frame.writeUInt8(type, 0);
   // Prefix by frame size as a 24 bit integer
   frame.writeUIntBE(msgLen, 1, 3);
   frame.write(payload, 4);

   return frame;
}

/**
 * Generate a random string of a given length
 */
function randomString (len) {
   var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.()[]{}+=`#"~&$*!:;,?./§';
   var str = '';

   for (var i = 0; i < len; i++) {
      str += chars.charAt((Math.random() * chars.length) | 0);
   }

   return str;
}

/**
 * Simple state machine implementation to facilitate protocol testing
 *
 * Pass `console.log` as a second argument to debug successive states
 */
function StateMachine(states, log) {
   this._states = states;
   this._state = null;
   this.log = log || function () {};

   this.transition('init');
}

/**
 * Consume state by passing some data
 */
StateMachine.prototype.tick = function (payload) {
   var cb = this._states[this._state];

   if (!cb) throw new Error('Invalid state: ' + this._state);

   this.log('[' + this._state + '] ' + (payload && payload.toString ? payload.toString() : payload));

   return cb.call(this, payload);
};

/**
 * Transition the machine to a given state for the next tick
 */
StateMachine.prototype.transition = function (newstate) {
   if (!(newstate in this._states)) throw new Error('Unregistered state: ' + newstate);

   this.log('Transitioning from ' + this._state + ' to ' + newstate);

   this._state = newstate;
};