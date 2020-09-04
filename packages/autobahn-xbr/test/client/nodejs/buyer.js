const autobahn = require('autobahn');
const xbr = require('autobahn-xbr');
const ethAccounts = require("web3-eth-accounts");
const ethSigUtils = require("eth-sig-util");
const ethUtil = require("ethereumjs-util");

console.log('Running on Autobahn ' + autobahn.version);
console.log('Running Autobahn-XBR ' + xbr.version);

const url = process.env.XBR_INSTANCE || "ws://localhost:8070/ws";
const realm = process.env.XBR_REALM || "idma";
const delegateEthKey = process.env.XBR_SELLER_DELEGATE_PRIVKEY || "77c5495fbb039eed474fc940f29955ed0531693cc9212911efd35dff0373153f";
const memberEthKey = process.env.XBR_SELLER_PRIVKEY || "2e114163041d2fb8d45f9251db259a68ee6bdbfd6d10fe1ae87c5c4bcd6ba491";
const cskey = process.env.XBR_SELLER_CS_KEY || "dc88492fcff5470fcc76f21fa03f1752e0738e1e5cd56cd61fc280bac4d4c4d9";

const wallet = new ethAccounts().privateKeyToAccount(memberEthKey);
const seed = autobahn.util.htob(cskey);
const keyPair = autobahn.nacl.sign.keyPair.fromSeed(seed);

const pubKey = xbr.with_0x(autobahn.util.btoh(keyPair.publicKey));
const data = xbr.create_market_member_login(wallet.address, pubKey);
const signature = ethSigUtils.signTypedData(ethUtil.toBuffer(xbr.with_0x(memberEthKey)), {data: data})


// WAMP connection
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

    // market maker ethereum address
    let config = await session.call('xbr.marketmaker.get_config');
    let marketmaker_adr = config['marketmaker'];

    // the XBR token has 18 decimals
    const decimals = new xbr.BN('1000000000000000000');

    // maximum price we are willing to pay per (single) key: 100 XBR
    const max_price = new xbr.BN('100').mul(decimals);

    // instantiate a simple buyer
    let buyer = new xbr.SimpleBuyer(marketmaker_adr, delegateEthKey, max_price);

    // start buying ..
    buyer.start(session).then(
        // success: we've got an active payment channel with remaining balance ..
        function (balance) {
            console.log("Buyer has started, remaining balance in active payment channel is " + balance.div(decimals) + " XBR");

            session.subscribe("xbr.myapp.example", function (args, kwargs, details) {
                let [key_id, enc_ser, ciphertext] = args;

                // decrypt the XBR payload, potentially automatically buying a new data encryption key
                buyer.unwrap(key_id, enc_ser, ciphertext).then(
                    function (payload) {
                        console.log("Received event " + details.publication, payload)
                    },
                    function (failure) {
                        console.log(failure);
                        process.exit(1);
                    }
                )
            });

        },
        // we don't have an active payment channel => bail out
        function (error) {
            console.log("Failed to start buyer:", error);
            process.exit(1);
        }
    );
};


// open WAMP session
connection.open();
