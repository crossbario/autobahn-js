const xbr = autobahnXbr;


console.log('Running Autobahn ' + autobahn.version);
console.log('Running Autobahn-XBR ' + xbr.version);


// WAMP connection
var connection = new autobahn.Connection({
    realm: "realm1",
    transports: [
        {
            url: 'ws://localhost:8080/ws',
            type: 'websocket',
            serializers: [ new autobahn.serializer.MsgpackSerializer() ]
        }
    ]
});


// callback fired upon new WAMP session
connection.onopen = function (session, details) {

    console.log("WAMP session connected:", details);

    // ethereum private key of seller2 delegate1
    const seller2_delegate1_pkey = "0x0874049f95d55fb76916262dc70571701b5c4cc5900c0691af75f1a8a52c8268";

    // market maker ethereum address
    const marketmaker_adr = "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9";

    // the XBR token has 18 decimals
    const decimals = new xbr.BN('1000000000000000000');

    // price in XBR per key
    const price = new xbr.BN(35).mul(decimals);

    // key rotation interval in seconds
    const key_rotation_interval = 10;

    // API ID of the interface of the offered service
    const api_id = xbr.uuid('bd65e220-aef7-43c0-a801-f8d95fa71f39');

    // instantiate a simple seller
    var seller = new xbr.SimpleSeller(marketmaker_adr, seller2_delegate1_pkey);
    var counter = 1;

    seller.add(api_id, 'io.crossbar.example', price, key_rotation_interval);

    var do_publish = function() {
        const payload = {"data": "js-browser-seller", "counter": counter};

        // encrypt the XBR payload, potentially automatically rotating & offering a new data encryption key
        let [key_id, enc_ser, ciphertext] = seller.wrap(api_id, 'io.crossbar.example', payload);

        const options = {acknowledge: true};

        session.publish("io.crossbar.example",
                        [key_id, enc_ser, ciphertext],
                        {},
                        options).then(
            function (pub) {
                console.log("Published event " + pub.id);
            },
            function (err) {
                console.log("Failed to publish event", err);
            }
        );

        counter += 1;
        setTimeout(do_publish, 1000);
    };

    // start selling
    seller.start(session).then(
        // success: we've got an active paying channel with remaining balance ..
        function (balance) {
            console.log("Seller has started, remaining balance in active paying channel is " + balance.div(decimals) + " XBR");
            do_publish();
        },
        // we don't have an active paying channel => bail out
        function (error) {
            console.log("Failed to start seller:", error);
            process.exit(1);
        }
    );
};


// open WAMP session
connection.open();
