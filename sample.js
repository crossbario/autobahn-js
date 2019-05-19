var autobahn = require('./lib/autobahn.js');
var seller = require('./lib/xbr/seller.js');
var buyer = require('./lib/xbr/buyer.js');


var connection = new autobahn.Connection({
   url: "ws://localhost:8080/ws",
   realm: "realm1",
    serializers: [new autobahn.serializer.CBORSerializer()]
});

var onRotate = function(series) {
    console.log("ROTATED");
};

connection.onopen = function (session, details) {
    // console.log("OPENED");
    // var simple_seller = new seller.SimpleSeller("0x3a1076bf45ab87712ad64ccb3b10217737f7faacbf2872e88fdd9a537d8fe266", 100);
    // simple_seller.add(autobahn.nacl.randomBytes(16), "io.crossbar", 10, 10000);
    // simple_seller.start(session);

    var simple_buyer = new buyer.SimpleBuyer("0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd", 200);
    simple_buyer.start(session, details.authid);
    // simple_buyer.openChannel("0x95ced938f7991cd0dfcb48f0a06a40fa1af46ebc", 200);
    simple_buyer.balance(
        function (balance) {
            console.log(balance)
        },
        function (failure) {

        });
    // var b = simple_buyer.balance();
    // console.log(typeof b);
    // console.log(b)
};

connection.onclose = function (reason, details) {
    console.log(reason);
    console.log(details);
};

connection.open();
