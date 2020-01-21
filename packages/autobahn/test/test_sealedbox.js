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

// this works via https://github.com/caolan/nodeunit

var autobahn = require('../index.js');


exports.testSealUnseal = function (testcase) {

   testcase.expect(1);
   var plainText = 'Sample Text';
   var buffer = Buffer.from(plainText);
   var keyPair = autobahn.nacl.box.keyPair();
   var sealed = autobahn.nacl.sealedbox.seal(buffer, keyPair.publicKey);
   var unsealed = autobahn.nacl.sealedbox.open(sealed, keyPair.publicKey, keyPair.secretKey);
   var text = String.fromCharCode.apply(null, unsealed);
   testcase.ok(plainText == text, "Text must match");
   testcase.done();
}
