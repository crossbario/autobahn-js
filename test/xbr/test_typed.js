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

var buyer_key = "0x" + "a4985a2ed93107886e9a1f12c7b8e2e351cc1d26c42f3aab7f220f3a7d08fda6";
var buyer_key_bytes = w3_utils.hexToBytes(buyer_key);
var account = new eth_accounts().privateKeyToAccount(buyer_key);
var addr = eth_util.toBuffer(account.address);

console.log("Using private key: " + buyer_key);
//console.log(buyer_key_bytes);
//console.log(account);
console.log("Account canonical address: " + account.address);
//console.log(addr);

data = {
    'types': {
        'EIP712Domain': [
            {'name': 'name', 'type': 'string'},
            {'name': 'version', 'type': 'string'},
            {'name': 'chainId', 'type': 'uint256'},
            {'name': 'verifyingContract', 'type': 'address'},
        ],
        'Transaction': [
            {'name': 'channel_adr', 'type': 'address'},
            {'name': 'channel_seq', 'type': 'uint256'},
            {'name': 'balance', 'type': 'uint256'},
        ],
    },
    'primaryType': 'Transaction',
    'domain': {
        'name': 'XBR',
        'version': '1',
        'chainId': 5777,
        'verifyingContract': '0x254dffcd3277c0b1660f6d42efbb754edababc2b',
    },
    'message': null,
}

//console.log(data);

//var key = eth_util.toBuffer(buyer_key_bytes);
var key = eth_util.toBuffer(buyer_key);

var msg = {
    channel_adr: '0x254dffcd3277c0b1660f6d42efbb754edababc2b',
    channel_seq: 1,
    balance: 0,
}
data['message'] = msg;

// eth_util.toBuffer
var sig = eth_sig_utils.signTypedData(key, {data: data})
console.log("Ok, signed typed data using " + account.address)
console.log("SIGNATURE = " + sig);

var signer = eth_sig_utils.recoverTypedSignature({data, sig});
signer = w3_utils.toChecksumAddress(signer);

if (signer === account.address) {
    console.log("Ok, verified signature was signed by " + signer);
} else {
    console.log("ERROR: signature verification failed");
}
