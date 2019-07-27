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
            // The buyer/seller delegate Ed25519 public key.
            {'name': 'pubkey', 'type': 'uint256'},

            // The UUID of the data encryption key bought/sold in the transaction.
            {'name': 'key_id', 'type': 'uint128'},

            // Channel transaction sequence number.
            {'name': 'channel_seq', 'type': 'uint32'},

            // Amount paid / earned.
            {'name': 'amount', 'type': 'uint256'},

            // Amount remaining in the payment/paying channel after the transaction.
            {'name': 'balance', 'type': 'uint256'},
        ],
    },
    'primaryType': 'Transaction',
    'domain': {
        'name': 'XBR',
        'version': '1',

        // test chain/network ID
        'chainId': 5777,

        // XBRNetwork contract address
        'verifyingContract': '0x254dffcd3277c0b1660f6d42efbb754edababc2b',
    },
    'message': {
        'pubkey': '0xebdfef6d225155873355bd4afeb2ed3100b0e0b5fddad12bd3cd498c1e0c1fbd',
        'key_id': '0xc37ba03c32608744c3c06302bf81d174',
        'channel_seq': 1,
        'amount': '35000000000000000000',
        'balance': 2000,
    },
}

//console.log(data);

//var key = eth_util.toBuffer(buyer_key_bytes);
var key = eth_util.toBuffer(buyer_key);

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
