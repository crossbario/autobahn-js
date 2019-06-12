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

exports.SimpleBuyer = require('./buyer.js').SimpleBuyer;
exports.SimpleSeller = require('./seller.js').SimpleSeller;

// https://truffleframework.com/docs/truffle/getting-started/package-management-via-npm#within-javascript-code
var contract = require("truffle-contract");

var XBRToken_json = require("./contracts/XBRToken.json");
var XBRNetwork_json = require("./contracts/XBRNetwork.json");
var XBRPaymentChannel_json = require("./contracts/XBRPaymentChannel.json");

var XBRToken = contract(XBRToken_json);
var XBRNetwork = contract(XBRNetwork_json);
var XBRPaymentChannel = contract(XBRPaymentChannel_json);

// export XBR smart contract Web3 generated classes
exports.XBRToken = XBRToken;
exports.XBRNetwork = XBRNetwork;
exports.XBRPaymentChannel = XBRPaymentChannel;

// a Web3 provider must be set by the user first to use this library
function setProvider (provider) {
    XBRToken.setProvider(provider);
    XBRNetwork.setProvider(provider);
    XBRPaymentChannel.setProvider(provider);
    init_xbr();
}

exports.setProvider = setProvider;

// debug log output
if ('XBR_DEBUG' in global && XBR_DEBUG) {
    console.log('XBR_DEBUG mode enabled');
}

//
// as long as we haven't deployed the XBR smart contracts to
// any public network (testnets or mainnet), a user must set the
// addresses of our deployed token and network smart contracts
// on the (private) network the user is connecting to and where
// the XBR contracts need to be deployed
//
function init_xbr() {
    if ('XBR_DEBUG_TOKEN_ADDR' in global && XBR_DEBUG_TOKEN_ADDR) {
        exports.xbrtoken = XBRToken.at(XBR_DEBUG_TOKEN_ADDR);
    } else {
        console.log('WARNING: The XBR smart contracts are not yet depoyed to public networks. Please set XBR_DEBUG_TOKEN_ADDR manually.');
        exports.xbrtoken = XBRToken.at("0xcfeb869f69431e42cdb54a4f4f105c19c080a601");
    }

    if ('XBR_DEBUG_NETWORK_ADDR' in global && XBR_DEBUG_NETWORK_ADDR) {
        exports.xbrnetwork = XBRNetwork.at(XBR_DEBUG_NETWORK_ADDR);
    } else {
        console.log('WARNING: The XBR smart contracts are not yet depoyed to public networks. Please set XBR_DEBUG_NETWORK_ADDR manually.');
        exports.xbrnetwork = XBRNetwork.at("0x254dffcd3277c0b1660f6d42efbb754edababc2b");
    }
}


// Solidity enums are not support in the ABI, so we replicate the enum
// constants here manually
// https://solidity.readthedocs.io/en/latest/frequently-asked-questions.html#if-i-return-an-enum-i-only-get-integer-values-in-web3-js-how-to-get-the-named-values

exports.MemberLevel = {
    NONE: 0,
    ACTIVE: 1,
    VERIFIED: 2,
    RETIRED: 3,
    PENALTY: 4,
    BLOCKED: 5,
}

exports.NodeType = {
    NONE: 0,
    MASTER: 1,
    CORE: 2,
    EDGE: 3,
}

exports.ActorType = {
    NONE: 0,
    NETWORK: 1,
    MARKET: 2,
    PROVIDER: 3,
    CONSUMER: 4,
}

const uuidv4 = require('uuid/v4');

exports.uuid = function () {
    const buffer = new Array();
    uuidv4(null, buffer);
    return buffer;
}
