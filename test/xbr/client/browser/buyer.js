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

    // ethereum private key of buyer2 delegate1
    const buyer2_delegate1_pkey = "0x21d7212f3b4e5332fd465877b64926e3532653e2798a11255a46f533852dfe46";

    // market maker ethereum address
    const marketmaker_adr = "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9";

    // the XBR token has 18 decimals
    const decimals = new xbr.BN('1000000000000000000');

    // maximum price we are willing to pay per (single) key: 100 XBR
    const max_price = new xbr.BN('100').mul(decimals);

    // instantiate a simple buyer
    var buyer = new xbr.SimpleBuyer(marketmaker_adr, buyer2_delegate1_pkey, max_price);

    // start buying ..
    buyer.start(session).then(
        // success: we've got an active payment channel with remaining balance ..
        function (balance) {
            console.log("Buyer has started, remaining balance in active payment channel is " + balance.div(decimals) + " XBR");

            session.subscribe("io.crossbar.example", function (args, kwargs, details) {
                let [key_id, enc_ser, ciphertext] = args;

                // decrypt the XBR payload, potentially automatically buying a new data encryption key
                buyer.unwrap(key_id, enc_ser, ciphertext).then(
                    function (payload) {
                        console.log("Received event " + details.publication, payload)
                    },
                    function (failure) {
                        console.log(failure);
                        location.reload(true);
                    }
                )
            });

        },
        // we don't have an active payment channel => bail out
        function (error) {
            console.log("Failed to start buyer:", error);
            location.reload(true);
        }
    );
};


// open WAMP session
connection.open();
