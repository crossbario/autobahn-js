///////////////////////////////////////////////////////////////////////////////
//
//  XBR Open Data Markets - https://xbr.network
//
//  JavaScript client library for the XBR Network.
//
//  Copyright (C) Crossbar.io Technologies GmbH and contributors
//
//  Licensed under the Apache 2.0 License:
//  https://opensource.org/licenses/Apache-2.0
//
///////////////////////////////////////////////////////////////////////////////

// this breaks MetaMask!
//var web3 = require('web3');
//exports.web3 = web3;

var ethereum = require('./ethereum.js');

exports.SimpleBuyer = require('./buyer.js').SimpleBuyer;
exports.SimpleSeller = require('./seller.js').SimpleSeller;
exports.SimpleBlockchain = require('./blockchain.js');

// export XBR smart contract Web3 generated classes
exports.XBRToken = ethereum.XBRToken;
exports.XBRNetwork = ethereum.XBRNetwork;
exports.XBRPaymentChannel = ethereum.XBRPaymentChannel;

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
