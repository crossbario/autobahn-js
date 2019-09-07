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

// this breaks MetaMask!
//var web3 = require('web3');
//exports.web3 = web3;

var pjson = require('../package.json');
exports.version = pjson.version;

var ethereum = require('./ethereum.js');

var eip712 = require('./eip712.js');
exports.sign_eip712_data = eip712.sign_eip712_data;
exports.recover_eip712_signer = eip712.recover_eip712_signer;

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

exports.uuid = ethereum.uuid;
