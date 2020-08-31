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

// FIXME: this breaks MetaMask!?
var web3 = require('web3');
var BN = web3.utils.BN;
exports.web3 = web3;
exports.BN = BN;

var cbor = require('cbor');
exports.cbor = cbor;

var pjson = require('../package.json');
exports.version = pjson.version;

var ethereum = require('./ethereum.js');

var eip712 = require('./eip712.js');
exports.sign_eip712_data = eip712.sign_eip712_data;
exports.recover_eip712_signer = eip712.recover_eip712_signer;
exports.create_market_member_login = eip712.create_market_member_login;

exports.SimpleBuyer = require('./buyer.js').SimpleBuyer;
exports.SimpleSeller = require('./seller.js').SimpleSeller;
exports.SimpleBlockchain = require('./blockchain.js');

// export XBR smart contract Web3 generated classes
exports.XBRToken = ethereum.XBRToken;
exports.XBRNetwork = ethereum.XBRNetwork;
exports.XBRChannel = ethereum.XBRChannel;

var setProvider = async function(provider) {
    await ethereum.setProvider(provider);
    exports.xbrtoken = ethereum.xbrtoken;
    exports.xbrnetwork = ethereum.xbrnetwork;
    exports.xbrchannel = ethereum.xbrchannel;
};

exports.setProvider = setProvider;
exports.xbrtoken = null;
exports.xbrnetwork = null;

// debug log output
if ('XBR_DEBUG' in global && XBR_DEBUG) {
    console.log('XBR_DEBUG mode enabled');
}

// Solidity enums are not supported in the ABI, so we replicate the enum
// constants here manually
// https://solidity.readthedocs.io/en/latest/frequently-asked-questions.html#if-i-return-an-enum-i-only-get-integer-values-in-web3-js-how-to-get-the-named-values

exports.MemberLevel = ethereum.MemberLevel;
exports.NodeType = ethereum.NodeType;
exports.ActorType = ethereum.ActorType;

let util = require('./util.js');

exports.uuid = util.uuid;
exports.pack_uint256 = util.pack_uint256;
exports.unpack_uint256 = util.unpack_uint256;
exports.with_0x = util.with_0x;
exports.without_0x = util.without_0x;
exports.XBR = util.XBR;
