// dicether/eip712
// eth-sig-util
// eth_sig_utils.signTypedData
// eth_sig_utils.recoverTypedSignature
// https://github.com/MetaMask/eth-sig-util#signtypeddata-privatekeybuffer-msgparams

var w3_utils = require("web3-utils");
var eth_sig_utils = require("eth-sig-util");
var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");

var buyer_key = "0x" + "552250dc897156fe232507373aa3dc9e3ab8c795cf1e70b802a537d5fc588136";
var buyer_key_bytes = w3_utils.hexToBytes(buyer_key);
var account = new eth_accounts().privateKeyToAccount(buyer_key);
var addr = eth_util.toBuffer(account.address);

console.log(buyer_key);
console.log(buyer_key_bytes);
console.log(account);
console.log(account.address);
console.log(addr);


data = {
    'types': {
        'EIP712Domain': [
            {'name': 'name', 'type': 'string'},
            {'name': 'version', 'type': 'string'},
            {'name': 'chainId', 'type': 'uint256'},
            {'name': 'verifyingContract', 'type': 'address'},
        ],
        'Person': [
            {'name': 'name', 'type': 'string'},
            {'name': 'wallet', 'type': 'address'}
        ],
        'Mail': [
            {'name': 'from', 'type': 'Person'},
            {'name': 'to', 'type': 'Person'},
            {'name': 'contents', 'type': 'string'}
        ]
    },
    'primaryType': 'Mail',
    'domain': {
        'name': 'Ether Mail',
        'version': '1',
        'chainId': 1,
        'verifyingContract': '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    'message': {
        'from': {
            'name': 'Cow',
            'wallet': '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        'to': {
            'name': 'Bob',
            'wallet': '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
            'foobar': 23,
        },
        'contents': 'Hello, Bob!',
    },
}

console.log(data);

//var key = eth_util.toBuffer(buyer_key_bytes);
var key = eth_util.toBuffer(buyer_key);

// eth_util.toBuffer
var sig = eth_sig_utils.signTypedData(key, {data: data})

console.log(sig);

var signer = eth_sig_utils.recoverTypedSignature({data, sig});

console.log(signer);

signer = w3_utils.toChecksumAddress(signer);

console.log(signer);

if (signer === account.address) {
    console.log("Ok, successfully verified signature");
} else {
    console.log("ERROR: signature verification failed");
}
