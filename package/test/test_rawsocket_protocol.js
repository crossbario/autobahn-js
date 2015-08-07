var stream = require('stream');
var rawsocket = require('./../lib/transport/rawsocket.js');


/**
 * The protocol must handle a valid handshake exchange
 */
module.exports = {
   testValidHandshake: function (testcase) {
      var wire = makeXWire();

      testcase.expect(3);

      var machine = new StateMachine({
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },
         waitForHandshake: function (handshake) {
            testcase.equal(handshake.length, 4, 'Handshake should be 4 bytes');
            testcase.equal(handshake[0], 0x7f, 'Magic byte must be 0x7f');
            testcase.ok([ 0x1, 0x2 ].indexOf(handshake[1] & 0xf) > -1, 'Must announce a valid serializer');

            setTimeout(function () {
               // Valid handshake reply
               var howdy = new Buffer(4);
               howdy.writeUInt8(0x7f, 0);
               howdy.writeUInt8(0xf1, 1);
               howdy.writeUInt8(0x00, 2);
               howdy.writeUInt8(0x00, 3);

               wire.tx.write(howdy);

               testcase.done();
            }, 10);
         },
      });


      var protocol = new rawsocket.Protocol(wire.rx);

      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

      protocol.on('error', function (err) {
         testcase.ok(false, 'Should not throw a protocol error');

         testcase.done();
      });

      machine.tick();
   },

   /**
    * The protocol must throw a ProtocolError when the server replies with a failed
    * handshake message
    */
   testFailedHandshake: function (testcase) {
      var wire = makeXWire();

      testcase.expect(1);

      var machine = new StateMachine({
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },
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


      var protocol = new rawsocket.Protocol(wire.rx);

      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

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
   testPing: function (testcase) {
      var wire = makeXWire();

      testcase.expect(4);

      var payload = randomString(256);

      var machine = new StateMachine({
         init: function () {
            this.transition('waitForHandshake');
            wire.rx.emit('connect');
         },
         waitForHandshake: function (handshake) {
            setTimeout(function () {
               var howdy = new Buffer(4);
               howdy.writeUInt8(0x7f, 0);
               howdy.writeUInt8(0xf1, 1);
               howdy.writeUInt8(0x00, 2);
               howdy.writeUInt8(0x00, 3);

               machine.transition('sendPing');

               wire.tx.write(howdy);

               machine.tick();
            }, 10);
         },
         sendPing: function () {
            setTimeout(function () {
               var frame = buildRawSocketFrame(0x01, payload);

               machine.transition('waitPong');

               wire.tx.write(frame);
            }, 10);
         },
         waitPong: function (packet) {
            console.log(packet);
            // First half-byte reserved and zeroed
            testcase.equal(packet[0] >> 4, 0, 'Reserved half-byte must be zeroed');
            // Second half-byte must indicate a PONG packet (0x2)
            testcase.equal(packet[0] & 0x0f, 0x2, 'Expected a PONG packet');
            // Check length
            testcase.equal(packet.readUIntBE(1, 3), packet.length - 4, 'Length prefix doesn\'t match frame length');
            // Check payload
            testcase.equal(packet.read('utf8', 4), payload, 'PONG reply must have the same payload as the PING packet');

            testcase.done();
         },
      }, console.log);


      var protocol = new rawsocket.Protocol(wire.rx);

      wire.tx.on('data', function (data) {
         machine.tick(data);
      });

      protocol.on('error', function (err) {
         testcase.ok(false, 'Should not throw a protocol error');

         testcase.done();
      });

      machine.tick();
   },
};


// Display swallowed errors
process.on('uncaughtException', function(err) {
  console.error(err.stack);
});


/**
 * Basic network connection mocking
 * Creates a pair of PassThrough streams and swap their write functions
 */
function makeXWire () {
   var rx = new stream.PassThrough();
   var tx = new stream.PassThrough();

   rx.__write = rx.write.bind(rx);
   tx.__write = tx.write.bind(tx);

   rx.write = tx.__write;
   tx.write = rx.__write;

   var close = function () {
      rx.emit('close');
      tx.emit('close');
   };

   rx.close = close;
   tx.close = close;

   return {
      rx: rx,
      tx: tx,
   };
}

function buildRawSocketFrame (type, payload) {
   // Get the frame size
   var msgLen = Buffer.byteLength(payload, 'utf8');

   // Create the frame
   var frame = new Buffer(payload.length + 4);

   // Message type
   frame.writeUInt8(type, 0);
   // Prefix by frame size as a 24 bit integer
   frame.writeUIntBE(msgLen, 1, 3);
   frame.write(payload, 4);

   return frame;
}

function randomString (len) {
   var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.()[]{}+=`#"~&$*!:;,?./§';
   var str = '';

   for (var i = 0; i < len; i++) {
      str += chars[(Math.random() * chars.length) | 0];
   }

   return str;
}

/**
 * Simple state machine implementation to facilitate protocol testing
 */
function StateMachine(states, log) {
   this._states = states;
   this._state = null;
   this.log = log || function () {};

   this.transition('init');
}

StateMachine.prototype.tick = function (payload) {
   var cb = this._states[this._state];

   if (!cb) throw new Error('Invalid state: ' + this._state);

   this.log('[' + this._state + '] ' + (payload && payload.toString ? payload.toString() : payload));

   return cb.call(this, payload);
};

StateMachine.prototype.transition = function (newstate) {
   if (!(newstate in this._states)) throw new Error('Unregistered state: ' + newstate);

   this.log('Transitioning from ' + this._state + ' to ' + newstate);

   this._state = newstate;
};