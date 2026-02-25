/**
 * RawSocket protocol unit tests (mock wire, no Crossbar.io needed).
 *
 * Migrated from nodeunit to Vitest as part of #601.
 */

// test, expect, describe are provided as globals by Vitest
var stream = require('stream');
var rawsocket = require('./../lib/transport/rawsocket.js');

describe('RawSocket protocol', function () {
   /**
    * The protocol must handle a valid handshake exchange
    */
   test('valid handshake', function () {
      return new Promise(function (resolve) {
         var wire = makeXWire();

         var assertions = [];

         var machine = new StateMachine({
            init: function () {
               this.transition('waitForHandshake');
               wire.rx.emit('connect');
            },
            waitForHandshake: function (handshake) {
               assertions.push(function () {
                  expect(handshake.length).toBe(4);
               });
               assertions.push(function () {
                  expect(handshake[0]).toBe(0x7f);
               });
               assertions.push(function () {
                  expect([0x1, 0x2].indexOf(handshake[1] & 0xf) > -1).toBe(true);
               });

               replyWithValidHandshake(wire.tx, null)();

               setTimeout(function () {
                  for (var i = 0; i < assertions.length; i++) {
                     assertions[i]();
                  }
                  resolve();
               }, 50);
            },
            wait: function () {},
         });

         var protocol = new rawsocket.Protocol(wire.rx);

         wire.tx.on('data', function (data) {
            machine.tick(data);
         });

         protocol.on('error', function () {
            expect.unreachable('Should not throw a protocol error');
            resolve();
         });

         machine.tick();
      });
   });

   /**
    * The protocol must throw a ProtocolError when the server replies with a
    * failed handshake message
    */
   test('failed handshake', function () {
      return new Promise(function (resolve) {
         var wire = makeXWire();

         var machine = new StateMachine({
            init: function () {
               this.transition('waitForHandshake');
               wire.rx.emit('connect');
            },
            waitForHandshake: function () {
               setTimeout(function () {
                  var howdy = Buffer.alloc(4);
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
            expect(err instanceof rawsocket.ProtocolError).toBe(true);
            resolve();
         });

         machine.tick();
      });
   });

   /**
    * The protocol should reply to PING packets with a PONG packet with the
    * same payload
    */
   test('ping reply', function () {
      return new Promise(function (resolve) {
         var wire = makeXWire();
         var payload = randomString(256);

         var machine = new StateMachine({
            init: function () {
               this.transition('waitForHandshake');
               wire.rx.emit('connect');
            },
            waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),
            sendPing: function () {
               setTimeout(function () {
                  var frame = buildRawSocketFrame(0x01, payload);
                  machine.transition('waitPong');
                  wire.tx.write(frame);
               }, 10);
            },
            waitPong: function (packet) {
               expect(packet[0] >> 4).toBe(0);
               expect(packet[0] & 0x0f).toBe(0x2);
               expect(packet.readUIntBE(1, 3)).toBe(packet.length - 4);
               expect(packet.toString('utf8', 4)).toBe(payload);
               resolve();
            },
         });

         var protocol = new rawsocket.Protocol(wire.rx);

         wire.tx.on('data', function (data) {
            machine.tick(data);
         });

         protocol.on('error', function () {
            expect.unreachable('Should not throw a protocol error');
            resolve();
         });

         machine.tick();
      });
   });

   /**
    * The protocol should accept a PONG packet with the same payload
    */
   test('ping request', function () {
      return new Promise(function (resolve) {
         var wire = makeXWire();

         var protocol;

         var machine = new StateMachine({
            init: function () {
               this.transition('waitForHandshake');
               wire.rx.emit('connect');
            },
            waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),
            sendPing: function () {
               setTimeout(function () {
                  machine.transition('waitPing');
                  protocol.ping();
               }, 10);
            },
            waitPing: function (packet) {
               expect(packet[0] >> 4).toBe(0);
               expect(packet[0] & 0x0f).toBe(0x1);
               expect(packet.readUIntBE(1, 3)).toBe(packet.length - 4);

               // Reply with a PONG using the same payload
               setTimeout(function () {
                  machine.transition('wait');
                  var frame = buildRawSocketFrame(0x2, packet.toString('utf8', 4));
                  wire.tx.write(frame);
               }, 10);

               // Declare test done after ping timeout delay
               setTimeout(function () {
                  resolve();
               }, protocol._options.ping_timeout + 10);

               machine.transition('wait');
            },
            wait: function () {},
         });

         protocol = new rawsocket.Protocol(wire.rx, {
            strict_pong: true,
            ping_timeout: 20,
         });

         wire.tx.on('data', function (data) {
            machine.tick(data);
         });

         protocol.on('error', function () {
            expect.unreachable('Should not throw a protocol error');
            resolve();
         });

         machine.tick();
      });
   });

   /**
    * The protocol should choke on a PONG packet with an unmatching payload
    */
   test('invalid pong', function () {
      return new Promise(function (resolve) {
         var wire = makeXWire();

         var protocol;

         var machine = new StateMachine({
            init: function () {
               this.transition('waitForHandshake');
               wire.rx.emit('connect');
            },
            waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),
            sendPing: function () {
               setTimeout(function () {
                  machine.transition('waitPing');
                  protocol.ping();
               }, 10);
            },
            waitPing: function (packet) {
               setTimeout(function () {
                  machine.transition('wait');
                  // Reply with wrong payload
                  var frame = buildRawSocketFrame(
                     0x2,
                     packet.toString('utf8', 'This is not supposed to be the same payload')
                  );
                  wire.tx.write(frame);
               }, 10);
               machine.transition('wait');
            },
            wait: function () {},
         });

         protocol = new rawsocket.Protocol(wire.rx, {
            strict_pong: true,
            ping_timeout: 20,
         });

         wire.tx.on('data', function (data) {
            machine.tick(data);
         });

         protocol.on('error', function (err) {
            expect(err instanceof rawsocket.ProtocolError).toBe(true);
            resolve();
         });

         machine.tick();
      });
   });

   /**
    * The protocol should throw an error if PING not answered
    */
   test('ping timeout', function () {
      return new Promise(function (resolve) {
         var wire = makeXWire();

         var machine = new StateMachine({
            init: function () {
               this.transition('waitForHandshake');
               wire.rx.emit('connect');
            },
            waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),
            sendPing: function () {
               setTimeout(function () {
                  machine.transition('wait');
                  protocol.ping();
               }, 10);
            },
            wait: function () {},
         });

         var protocol = new rawsocket.Protocol(wire.rx, {
            strict_pong: true,
            ping_timeout: 20,
         });

         wire.tx.on('data', function (data) {
            machine.tick(data);
         });

         // Should throw since we didn't reply to the PING
         protocol.on('error', function (err) {
            expect(err instanceof rawsocket.ProtocolError).toBe(true);
            resolve();
         });

         machine.tick();
      });
   });

   /**
    * The protocol should receive JSON frames
    */
   test('data receive', function () {
      return new Promise(function (resolve) {
         var wire = makeXWire();
         var obj = [1, null, [true, false], [-21, 0.6666], { a: 'hello', b: ['jamie', 'nicole'] }];

         var machine = new StateMachine({
            init: function () {
               this.transition('waitForHandshake');
               wire.rx.emit('connect');
            },
            waitForHandshake: replyWithValidHandshake(wire.tx, 'sendData'),
            sendData: function () {
               setTimeout(function () {
                  machine.transition('wait');
                  var frame = buildRawSocketFrame(0x0, JSON.stringify(obj));
                  wire.tx.write(frame);
               }, 10);
            },
            wait: function () {},
         });

         var protocol = new rawsocket.Protocol(wire.rx);

         wire.tx.on('data', function (data) {
            machine.tick(data);
         });

         protocol.on('error', function () {
            expect.unreachable('Should not throw a protocol error');
            resolve();
         });

         protocol.on('data', function (data) {
            expect(data).toEqual(obj);
            resolve();
         });

         machine.tick();
      });
   });

   /**
    * The protocol should send JSON frames
    */
   test('data send', function () {
      return new Promise(function (resolve) {
         var wire = makeXWire();
         var obj = [1, null, [true, false], [-21, 0.6666], { a: 'hello', b: ['jamie', 'nicole'] }];

         var machine = new StateMachine({
            init: function () {
               this.transition('waitForHandshake');
               wire.rx.emit('connect');
            },
            waitForHandshake: replyWithValidHandshake(wire.tx, 'sendData'),
            sendData: function () {
               setTimeout(function () {
                  machine.transition('receiveData');
                  protocol.write(obj);
               }, 10);
            },
            receiveData: function (frame) {
               expect(frame[0] >> 4).toBe(0x0);
               expect(frame[0] & 0xf).toBe(0x0);
               expect(frame.readUIntBE(1, 3)).toBe(frame.length - 4);

               var payload = frame.toString('utf8', 4);
               var parsed = JSON.parse(payload);
               expect(parsed).toEqual(obj);

               resolve();
            },
         });

         var protocol = new rawsocket.Protocol(wire.rx);

         wire.tx.on('data', function (data) {
            machine.tick(data);
         });

         protocol.on('error', function () {
            expect.unreachable('Should not throw a protocol error');
            resolve();
         });

         machine.tick();
      });
   });

   /**
    * The protocol should handle chunked requests
    */
   test('chunked data', function () {
      return new Promise(function (resolve) {
         var wire = makeXWire();
         var obj = [1, null, [true, false], [-21, 0.6666], { a: 'hello', b: ['jamie', 'nicole'] }];

         var machine = new StateMachine({
            init: function () {
               this.transition('waitForHandshake');
               wire.rx.emit('connect');
            },
            waitForHandshake: replyWithValidHandshake(wire.tx, 'sendData'),
            sendData: function () {
               this.transition('wait');
               var frame = buildRawSocketFrame(0x0, JSON.stringify(obj));

               function sendChunk(start, end) {
                  wire.tx.write(frame.slice(start, end));
               }

               // Send frame one byte at a time with 2ms interval
               for (var i = 0; i < frame.length; i++) {
                  setTimeout(sendChunk, i * 2, i, i + 1);
               }
            },
            wait: function () {},
         });

         var protocol = new rawsocket.Protocol(wire.rx);

         wire.tx.on('data', function (data) {
            machine.tick(data);
         });

         protocol.on('error', function () {
            expect.unreachable('Should not throw a protocol error');
            resolve();
         });

         protocol.on('data', function (data) {
            expect(data).toEqual(obj);
            resolve();
         });

         machine.tick();
      });
   });
});

// ---------------------------------------------------------------------------
// Test helpers (preserved from original test file)
// ---------------------------------------------------------------------------

/**
 * Basic network connection mocking.
 * Creates a pair of PassThrough streams and swap their write functions.
 */
function makeXWire() {
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

   return { rx: rx, tx: tx };
}

/**
 * Creates a function that writes a valid handshake reply to `connection`
 * after `delay` and transitions the state machine to `transitionTo`.
 */
function replyWithValidHandshake(connection, transitionTo, delay) {
   return function () {
      var self = this;
      setTimeout(function () {
         var howdy = Buffer.alloc(4);
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
 * Create a RawSocket frame of a given `type` and `payload`.
 */
function buildRawSocketFrame(type, payload) {
   var msgLen = Buffer.byteLength(payload, 'utf8');
   var frame = Buffer.alloc(msgLen + 4);

   frame.writeUInt8(type, 0);
   frame.writeUIntBE(msgLen, 1, 3);
   frame.write(payload, 4);

   return frame;
}

/**
 * Generate a random string of a given length.
 */
function randomString(len) {
   var chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.()[]{}+=`#"~&$*!:;,?./';
   var str = '';

   for (var i = 0; i < len; i++) {
      str += chars.charAt((Math.random() * chars.length) | 0);
   }

   return str;
}

/**
 * Simple state machine implementation to facilitate protocol testing.
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
   this.log(
      '[' + this._state + '] ' + (payload && payload.toString ? payload.toString() : payload)
   );
   return cb.call(this, payload);
};

StateMachine.prototype.transition = function (newstate) {
   if (!(newstate in this._states)) throw new Error('Unregistered state: ' + newstate);
   this.log('Transitioning from ' + this._state + ' to ' + newstate);
   this._state = newstate;
};
