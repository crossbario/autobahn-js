let autobahn = require('autobahn');
let xbr = require('autobahn-xbr');
const ethAccounts = require("web3-eth-accounts");
const ethSigUtils = require("eth-sig-util");
const ethUtil = require("ethereumjs-util");
const w3Utils = require("web3-utils");

console.log('Running on Autobahn ' + autobahn.version);
console.log('Running Autobahn-XBR ' + xbr.version);

const url = process.env.XBR_INSTANCE || "ws://localhost:8070/ws";
const realm = process.env.XBR_REALM || "idma";
const delegateEthKey = process.env.XBR_SELLER_DELEGATE_PRIVKEY || "d99b5b29e6da2528bf458b26237a6cf8655a3e3276c1cdc0de1f98cefee81c01";
const memberEthKey = process.env.XBR_SELLER_PRIVKEY || "2eac15546def97adc6d69ca6e28eec831189baa2533e7910755d15403a0749e8";
const cskey = process.env.XBR_SELLER_CS_KEY || "0db085a389c1216ad62b88b408e1d830abca9c9f9dad67eb8c8f8734fe7575eb";

const wallet = new ethAccounts().privateKeyToAccount(memberEthKey);
const seed = autobahn.util.htob(cskey);
const keyPair = autobahn.nacl.sign.keyPair.fromSeed(seed);

const pubKey = xbr.with_0x(autobahn.util.btoh(keyPair.publicKey));
const data = xbr.create_market_member_login(wallet.address, pubKey);
const signature = ethSigUtils.signTypedData(ethUtil.toBuffer(xbr.with_0x(memberEthKey)), {data: data})

// WAMP connection
let connection = new autobahn.Connection({
    url: url,
    authid: 'public',
    realm: realm,
    authextra: {
        pubkey: keyPair.publicKey,
        wallet_address: ethUtil.toBuffer(wallet.address),
        signature: ethUtil.toBuffer(signature)
    },
    pkey: keyPair,
    authmethods: ['cryptosign'],
    onchallenge: (session, method, extra) => {
        // we only know how to process WAMP-cryptosign here!
        if (method === "cryptosign") {
            return autobahn.auth_cryptosign.sign_challenge(keyPair, extra);
        } else {
            throw "don't know how to authenticate using '" + method + "'";
        }
    },
    serializers: [new autobahn.serializer.MsgpackSerializer()]
});


// callback fired upon new WAMP session
connection.onopen = async function (session, details) {

    console.log("WAMP session connected:", details);

    let config = await session.call('xbr.marketmaker.get_config');
    let marketMakerAdr = config['marketmaker'];

    // the XBR token has 18 decimals
    const decimals = new xbr.BN('1000000000000000000');

    // price in XBR per key
    const price = new xbr.BN(1).mul(decimals);

    // key rotation interval in seconds
    const key_rotation_interval = 10;

    // API ID of the interface of the offered service
    const api_id = xbr.uuid('bd65e220-aef7-43c0-a801-f8d95fa71f39');

    // instantiate a simple seller
    let seller = new xbr.SimpleSeller(marketMakerAdr, delegateEthKey);
    let counter = 1;

    seller.add(api_id, 'xbr.myapp.example', price, key_rotation_interval);


    let do_publish = function(counter) {
        const payload = {"data": "js-node-seller", "counter": counter};

        // encrypt the XBR payload, potentially automatically rotating & offering a new data encryption key
        let [key_id, enc_ser, ciphertext] = seller.wrap(api_id, 'xbr.myapp.example', payload);

        const options = {acknowledge: true};

        session.publish("xbr.myapp.example",
            [key_id, enc_ser, ciphertext],
            {},
            options
        ).then(
            function (pub) {
                console.log("Published event " + pub.id);
            },
            function (err) {
                console.log("Failed to publish event", err);
            }
        );
    };
    function on_cardata (args) {
        data = args[0];
        do_publish(data);
        console.log("on_counter() event received with counter " + data);
    }

    session.subscribe('xbr.myapp.odometer', on_cardata).then(
        function (sub) {
            console.log(' xbr.myapp.odometer subscribed to topic');

        },
        function (err) {
            console.log('xbr.myapp.cardata failed to subscribe to topic', err);
        }
    );
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
