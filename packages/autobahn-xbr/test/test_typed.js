// dicether/eip712
// eth-sig-util
// eth_sig_utils.signTypedData
// eth_sig_utils.recoverTypedSignature
// https://github.com/MetaMask/eth-sig-util#signtypeddata-privatekeybuffer-msgparams
// https://github.com/MetaMask/eth-sig-util#signtypeddata-privatekeybuffer-msgparams

var w3_utils = require("web3-utils");
var eth_sig_utils = require("eth-sig-util");
var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");
const utils = eth_sig_utils.TypedDataUtils;

var buyer_key = "0x" + "a4985a2ed93107886e9a1f12c7b8e2e351cc1d26c42f3aab7f220f3a7d08fda6";
var buyer_key_bytes = w3_utils.hexToBytes(buyer_key);
const consumer_key = '0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd';
const consumer_delegate_key = '0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52';

var account = new eth_accounts().privateKeyToAccount(consumer_key);
var addr = eth_util.toBuffer(account.address);

console.log("Using private key: " + buyer_key);
//console.log(buyer_key_bytes);
//console.log(account);
console.log("Account canonical address: " + account.address);
//console.log(addr);

const data3 = {
    types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' }
        ],
        Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' }
        ],
    },
    primaryType: 'Mail',
    domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    message: {
        from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
    },
};

data2 = {
    "primaryType": "Mail",
    "domain": {
        "name": "Ether Mail",
        "version": "1",
        "chainId": "0x1",
        "verifyingContract": "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
    },
    "message": {
        "from": {
            "name": "Cow",
            "wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
        },
        "to": {
            "name": "Bob",
            "wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
        },
        "contents": "Hello, Bob!"
    },
    "types": {
        "EIP712Domain": [
            {"name": "name", "type": "string"},
            {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"},
            {"name": "verifyingContract", "type": "address"}
        ],
        "Person": [
            {"name": "name", "type": "string"},
            {"name": "wallet", "type": "address"}
        ],
        "Mail": [
            {"name": "from", "type": "Person"},
            {"name": "to", "type": "Person"},
            {"name": "contents", "type": "string"}
        ]
    }
}

data = {
    'types': {
        'EIP712Domain': [
            {'name': 'name', 'type': 'string'},
            {'name': 'version', 'type': 'string'},
            {'name': 'chainId', 'type': 'uint256'},
            {'name': 'verifyingContract', 'type': 'address'},
        ],
        'ChannelClose': [
            {'name': 'channel_adr', 'type': 'address'},
            {'name': 'channel_seq', 'type': 'uint32'},
            {'name': 'balance', 'type': 'uint256'},
        ],
    },
    'primaryType': 'ChannelClose',
    'domain': {
        'name': 'XBR',
        'version': '1',
        'chainId': 1,
        'verifyingContract': '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
    },
    'message': null,
}

//console.log(data);

//var key = eth_util.toBuffer(buyer_key_bytes);
//var key = eth_util.toBuffer(buyer_key);
var key = eth_util.toBuffer(consumer_key);

var msg = {
    channel_adr: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
    channel_seq: 39,
    balance: 2700,
}
data['message'] = msg;
// signature: 0xe32976b152f5d3107a789bee8512741493c262984145415c1ffb3a42c1a80e7224dd52cc552bf86665dd185d9e04004eb8d783f624eeb6aab0011c21757e6bb21b

//data = data2;

// eth_util.toBuffer

//var msg_hash = eth_sig_utils.typedSignatureHash(data.message);
//console.log("MSGHASH", msg_hash);

var msg_hash = utils.hashStruct(data.primaryType, data.message, data.types);
console.log('MSG_HASH = ', eth_util.bufferToHex(msg_hash));

var msg_sig = eth_sig_utils.signTypedData(key, {data: data})
console.log("Ok, signed typed data using " + account.address)
console.log("SIGNATURE = " + msg_sig);

var signer = eth_sig_utils.recoverTypedSignature({data: data, sig: msg_sig});
signer = w3_utils.toChecksumAddress(signer);

if (signer === account.address) {
    console.log("Ok, verified signature was signed by " + signer);
} else {
    console.log("ERROR: signature verification failed");
}

// const typedData = {
// types: {
//     EIP712Domain: [
//         { name: 'name', type: 'string' },
//         { name: 'version', type: 'string' },
//         { name: 'chainId', type: 'uint256' },
//         { name: 'verifyingContract', type: 'address' },
//     ],
//     Person: [
//         { name: 'name', type: 'string' },
//         { name: 'wallet', type: 'address' }
//     ],
//     Mail: [
//         { name: 'from', type: 'Person' },
//         { name: 'to', type: 'Person' },
//         { name: 'contents', type: 'string' }
//     ],
// },
// primaryType: 'Mail',
// domain: {
//     name: 'Ether Mail',
//     version: '1',
//     chainId: 1,
//     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
// },
// message: {
//     from: {
//         name: 'Cow',
//         wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
//     },
//     to: {
//         name: 'Bob',
//         wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
//     },
//     contents: 'Hello, Bob!',
// },
// }

// const privateKey = eth_util.sha3('cow');
// const address = eth_util.privateToAddress(privateKey);
// const sig = eth_sig_utils.signTypedData(privateKey, { data: typedData });

// var assert = require('assert');

// assert.equal(utils.encodeType('Mail', typedData.types), 'Mail(Person from,Person to,string contents)Person(string name,address wallet)');
// assert.equal(eth_util.bufferToHex(utils.hashType('Mail', typedData.types)), '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2');
// assert.equal(eth_util.bufferToHex(utils.encodeData(typedData.primaryType, typedData.message, typedData.types)), '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2fc71e5fa27ff56c350aa531bc129ebdf613b772b6604664f5d8dbe21b85eb0c8cd54f074a4af31b4411ff6a60c9719dbd559c221c8ac3492d9d872b041d703d1b5aadf3154a261abdd9086fc627b61efca26ae5702701d05cd2305f7c52a2fc8');
// assert.equal(eth_util.bufferToHex(utils.hashStruct(typedData.primaryType, typedData.message, typedData.types)), '0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e');
// assert.equal(eth_util.bufferToHex(utils.hashStruct('EIP712Domain', typedData.domain, typedData.types)), '0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f');
// assert.equal(eth_util.bufferToHex(utils.sign(typedData)), '0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2');
// assert.equal(eth_util.bufferToHex(address), '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826')
// assert.equal(sig, '0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b915621c')


// var msg_hash = utils.hashStruct(data.primaryType, data.message, data.types);
// console.log('msg_hash:', eth_util.bufferToHex(msg_hash));

// const sig2 = eth_util.ecsign(msg_hash, key)
// const sig2_flat = eth_sig_utils.concatSig(sig2.v, sig2.r, sig2.s)
// console.log('sig2_flat:', eth_util.bufferToHex(sig2_flat));
