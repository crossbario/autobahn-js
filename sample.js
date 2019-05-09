var autobahn = require('./lib/autobahn.js');
var seller = require('./lib/xbr/seller.js');


var connection = new autobahn.Connection({
   url: "ws://localhost:8080/ws",
   realm: "realm1"
});

connection.onopen = function (session, details) {
    console.log("OPENED");
    var simple_seller = new seller.SimpleSeller("0x3a1076bf45ab87712ad64ccb3b10217737f7faacbf2872e88fdd9a537d8fe266", 100);
    simple_seller.start(session);
    console.log(simple_seller._session);
};

connection.onclose = function (reason, details) {
    console.log(reason);
    console.log(details);
};

connection.open();
