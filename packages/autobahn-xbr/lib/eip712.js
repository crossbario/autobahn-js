///////////////////////////////////////////////////////////////////////////////
//
//  XBR Open Data Markets - https://xbr.network
//
//  JavaScript client library for the XBR Network.
//
//  Copyright (C) Crossbar.io Technologies GmbH and contributors
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var w3_utils = require("web3-utils");
var eth_sig_utils = require("eth-sig-util");
var eth_util = require("ethereumjs-util");


function _create_eip712_data (verifying_adr, channel_adr, channel_seq, balance, is_final) {
    const _EIP712_MSG = {
        'types': {
            'EIP712Domain': [
                {'name': 'name', 'type': 'string'},
                {'name': 'version', 'type': 'string'},
                {'name': 'chainId', 'type': 'uint256'},
                {'name': 'verifyingContract', 'type': 'address'},
            ],
            'ChannelClose': [
                // The channel contract address.
                {'name': 'channel_adr', 'type': 'address'},

                // Channel off-chain transaction sequence number.
                {'name': 'channel_seq', 'type': 'uint32'},

                // Balance remaining in after the transaction.
                {'name': 'balance', 'type': 'uint256'},

                // Transaction is marked as final.
                {'name': 'is_final', 'type': 'bool'},
            ],
        },
        'primaryType': 'ChannelClose',
        'domain': {
            'name': 'XBR',
            'version': '1',
            'chainId': 1,
            'verifyingContract': verifying_adr,
        },
        'message': {
            'channel_adr': channel_adr,
            'channel_seq': channel_seq,
            'balance': balance,
            'is_final': is_final,
        },
    }
    return _EIP712_MSG;
}

function sign_eip712_data (eth_privkey, channel_adr, channel_seq, balance, is_final) {
    const verifying_adr = '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B';
    console.log('.................', verifying_adr, channel_adr, channel_seq, balance, is_final);
    const msg = _create_eip712_data(verifying_adr, channel_adr, channel_seq, balance, is_final);
    //const msg = _create_eip712_data(verifying_adr, channel_adr, 0, 0, false);
    const sig = eth_sig_utils.signTypedData(eth_privkey, {data: msg});
    console.log('.................', sig);
    return eth_util.toBuffer(sig);
}

function recover_eip712_signer (channel_adr, channel_seq, balance, is_final, signature) {
    const verifying_adr = '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B';
    const msg = _create_eip712_data(verifying_adr, channel_adr, channel_seq, balance, is_final);
    const signer = eth_sig_utils.recoverTypedSignature({msg, signature});
    return w3_utils.toChecksumAddress(signer);
}

exports.sign_eip712_data = sign_eip712_data;
exports.recover_eip712_signer = recover_eip712_signer;
