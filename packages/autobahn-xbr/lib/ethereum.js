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

// https://truffleframework.com/docs/truffle/getting-started/package-management-via-npm#within-javascript-code
var contract = require("@truffle/contract");

var XBRToken_json = require("./contracts/XBRToken.json");
var XBRNetwork_json = require("./contracts/XBRNetwork.json");
var XBRChannel_json = require("./contracts/XBRChannel.json");

var XBRToken = contract(XBRToken_json);
var XBRNetwork = contract(XBRNetwork_json);
var XBRChannel = contract(XBRChannel_json);

// a Web3 provider must be set by the user first to use this library
var setProvider = async function (provider) {
    XBRToken.setProvider(provider);
    XBRNetwork.setProvider(provider);
    XBRChannel.setProvider(provider);
    await init_xbr();
};

var MemberLevel = {
    NONE: 0,
    ACTIVE: 1,
    VERIFIED: 2,
    RETIRED: 3,
    PENALTY: 4,
    BLOCKED: 5,
};
var NodeType = {
    NONE: 0,
    MASTER: 1,
    CORE: 2,
    EDGE: 3,
};
var ActorType = {
    NONE: 0,
    NETWORK: 1,
    MARKET: 2,
    PROVIDER: 3,
    CONSUMER: 4,
};
//
// as long as we haven't deployed the XBR smart contracts to
// any public network (testnets or mainnet), a user must set the
// addresses of our deployed token and network smart contracts
// on the (private) network the user is connecting to and where
// the XBR contracts need to be deployed
//
async function init_xbr() {
    if ('XBR_DEBUG_TOKEN_ADDR' in global && XBR_DEBUG_TOKEN_ADDR) {
        exports.xbrtoken = await XBRToken.at(XBR_DEBUG_TOKEN_ADDR);
    } else {
        console.log('WARNING: The XBR smart contracts are not yet depoyed to public networks. Please set XBR_DEBUG_TOKEN_ADDR manually.');
        exports.xbrtoken = await XBRToken.at("0xaCef957D54c639575f4DB68b1992B36504f33FEA");
    }

    if ('XBR_DEBUG_NETWORK_ADDR' in global && XBR_DEBUG_NETWORK_ADDR) {
        exports.xbrnetwork = await XBRNetwork.at(XBR_DEBUG_NETWORK_ADDR);
    } else {
        console.log('WARNING: The XBR smart contracts are not yet depoyed to public networks. Please set XBR_DEBUG_NETWORK_ADDR manually.');
        exports.xbrnetwork = await XBRNetwork.at("0x7A3d22c59e8F8f1b88ba7205f3f5a65Bc86D04Bc");
    }

    if ('XBR_DEBUG_CHANNEL_ADDR' in global && XBR_DEBUG_CHANNEL_ADDR) {
        exports.xbrchannel = await XBRChannel.at(XBR_DEBUG_CHANNEL_ADDR);
    } else {
        console.log('WARNING: The XBR smart contracts are not yet depoyed to public networks. Please set XBR_DEBUG_CHANNEL_ADDR manually.');
        exports.xbrchannel = await XBRChannel.at("0x670497A012322B99a5C18B8463940996141Cb952");
    }
}

exports.XBRToken = XBRToken;
exports.XBRNetwork = XBRNetwork;
exports.XBRChannel = XBRChannel;
exports.MemberLevel = MemberLevel;
exports.NodeType = NodeType;
exports.ActorType = ActorType;
exports.setProvider = setProvider;
