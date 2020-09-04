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

const assert = require('assert');

const eth_sig_utils = require("eth-sig-util");
const eth_util = require("ethereumjs-util");

const web3 = require('web3');
const BN = web3.utils.BN;

// the XBR token has 18 decimals
const decimals = new BN('1000000000000000000');

// constant in the EIP712 typed data
const verifying_adr = '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B';


function _create_eip712_data (chain_id, verifying_contract, close_at, market_oid, channel_oid, channel_seq, balance,
                              is_final) {
    return {
        'types': {
            'EIP712Domain': [
                {
                    'name': 'name',
                    'type': 'string'
                },
                {
                    'name': 'version',
                    'type': 'string'
                },
            ],
            'EIP712ChannelClose': [{
                'name': 'chainId',
                'type': 'uint256'
            }, {
                'name': 'verifyingContract',
                'type': 'address'
            }, {
                'name': 'closeAt',
                'type': 'uint256'
            }, {
                'name': 'marketId',
                'type': 'bytes16'
            }, {
                'name': 'channelId',
                'type': 'bytes16'
            }, {
                'name': 'channelSeq',
                'type': 'uint32'
            }, {
                'name': 'balance',
                'type': 'uint256'
            }, {
                'name': 'isFinal',
                'type': 'bool'
            }]
        },
        'primaryType': 'EIP712ChannelClose',
        'domain': {
            'name': 'XBR',
            'version': '1',
        },
        'message': {
            'chainId': chain_id,
            'verifyingContract': verifying_contract,
            'closeAt': close_at,
            'marketId': market_oid,
            'channelId': channel_oid,
            'channelSeq': channel_seq,
            'balance': balance,
            'isFinal': is_final
        }
    }
}


function sign_eip712_data(eth_privkey, chain_id, verifying_contract, close_at, market_oid, channel_oid, channel_seq,
                          balance, is_final) {
    assert.equal(BN.isBN(balance), true);
    assert.equal(typeof is_final === "boolean", true);
    const msg = _create_eip712_data(chain_id, verifying_contract, close_at, market_oid, channel_oid, channel_seq,
        balance, is_final);
    const sig = eth_sig_utils.signTypedData(eth_privkey, {data: msg});
    return eth_util.toBuffer(sig);
}


function recover_eip712_signer(chain_id, verifying_contract, close_at, market_oid, channel_oid, channel_seq, balance,
                               is_final, signature) {
    const msg = _create_eip712_data(chain_id, verifying_contract, close_at, market_oid, channel_oid, channel_seq,
        balance, is_final);
    return eth_sig_utils.recoverTypedSignature({data: msg, sig: signature});
}


function create_market_member_login(member, clientPubKey) {
    return {
        'types': {
            'EIP712Domain': [
                {
                    'name': 'name',
                    'type': 'string'
                },
                {
                    'name': 'version',
                    'type': 'string'
                },
            ],
            'EIP712MarketMemberLogin': [
                {
                    'name': 'member',
                    'type': 'address'
                },
                {
                    'name': 'client_pubkey',
                    'type': 'bytes32',
                },
            ]
        },
        'primaryType': 'EIP712MarketMemberLogin',
        'domain': {
            'name': 'XBR',
            'version': '1',
        },
        'message': {
            'member': member,
            'client_pubkey': clientPubKey,
        }
    }
}


exports.sign_eip712_data = sign_eip712_data;
exports.recover_eip712_signer = recover_eip712_signer;
exports.decimals = decimals;
exports.verifying_adr = verifying_adr;
exports.create_market_member_login = create_market_member_login;
