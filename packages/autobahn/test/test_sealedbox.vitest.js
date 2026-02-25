// Migrated from nodeunit to Vitest as part of #601.
// NOTE: This test was already disabled in nodeunit (commented out in test.js).
// autobahn.nacl.sealedbox is not currently exported. Skipping until fixed.

var autobahn = require('../index.js');

describe('sealedbox', function () {
   test.skip('seal and unseal', function () {
      var plainText = 'Sample Text';
      var buffer = Buffer.from(plainText);
      var keyPair = autobahn.nacl.box.keyPair();
      var sealed = autobahn.nacl.sealedbox.seal(buffer, keyPair.publicKey);
      var unsealed = autobahn.nacl.sealedbox.open(sealed, keyPair.publicKey, keyPair.secretKey);
      var text = String.fromCharCode.apply(null, unsealed);
      expect(text).toBe(plainText);
   });
});
