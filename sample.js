var autobahn = require('./lib/autobahn.js');
var seller = require('./lib/xbr/seller.js');


simple_seller = new seller.SimpleSeller("0x3a1076bf45ab87712ad64ccb3b10217737f7faacbf2872e88fdd9a537d8fe266", 100);
simple_seller.start("Hello");
