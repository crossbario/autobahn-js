///////////////////////////////////////////////////////////////////////////////
//
//  XBR Open Data Markets - https://xbr.network
//
//  JavaScript client library for the XBR Network.
//
//  Copyright (C) typedef int GmbH and contributors
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var Web3 = require("web3");
var xbr = require('./ethereum.js');

var DomainStatus_NULL = 0;
var DomainStatus_ACTIVE = 1;
var DomainStatus_CLOSED = 2;

var SimpleBlockchain = function (gateway) {
    this.gateway = gateway;
    this.w3 = null;
};

SimpleBlockchain.prototype.start = function() {
    if (this.gateway != null) {
        return;
    }

    if (this.gateway == null) {
        this.w3 = new Web3(Web3.currentProvider);
    } else {
        this.w3 = new Web3(new Web3.providers.HttpProvider(this.gateway));
    }

    if (this.w3.isConnected()) {
        throw `could not connect to Web3/Ethereum at: ${this.gateway || 'auto'}`;
    } else {
        console.log(`Connected to network ${this.w3.version.network} at provider ${this.gateway || 'auto'}`)
    }
};

SimpleBlockchain.prototype.stop = function() {
    this.w3 = null;
};

SimpleBlockchain.prototype.getMarketStatus = async function(marketID) {
    let owner = xbr.xbrnetwork.functions.getMarketOwner(marketID).call();
    if (owner == null || owner == "0x0000000000000000000000000000000000000000") {
        return null;
    } else {
        return {'owner': owner}
    }
};

SimpleBlockchain.prototype.getDomainStatus = async function(domainID) {
    status = xbr.xbrnetwork.functions.getDomainStatus(domainID).call();
    if (status == DomainStatus_NULL) {
        return null;
    } else if (status == DomainStatus_ACTIVE) {
        return {'status': 'ACTIVE'}
    } else if (status == DomainStatus_CLOSED) {
        return {'status': 'CLOSED'}
    }
};

SimpleBlockchain.prototype.getNodeStatus = function(delegateAddr) {

};

SimpleBlockchain.prototype.getActorStatus = function(channelAddr) {

};

SimpleBlockchain.prototype.getDelegateStatus = function(delegateAddr) {

};

SimpleBlockchain.prototype.getChannelStatus = function(channelAddr) {

};

SimpleBlockchain.prototype.getMemberStatus = async function(memberAddr) {
    var level = xbr.xbrnetwork.functions.getMemberLevel(memberAddr).call();
    if (level == null) {
        return null;
    }
    var eula = xbr.xbrnetwork.functions.getMemberEula(memberAddr).call();
    if (eula == null || eula.trim() == '') {
        return null;
    }
    var profile = xbr.xbrnetwork.functions.getMemberProfile(memberAddr).call();
    if (profile == null || profile.trim() == '') {
        profile = null;
    }
    return {
        'eula': eula,
        'profile': profile,
    }
};

SimpleBlockchain.prototype.getBalances = async function(accountAddr) {
    var balanceETH = this.w3.eth.getBalance(accountAddr);
    var balanceXBR = xbr.xbrtoken.functions.balanceOf(accountAddr).call()
    return {
        'ETH': balanceETH,
        'XBR': balanceXBR,
    }
};

SimpleBlockchain.prototype.getContractAddr = function() {
    return {
        'XBRToken': xbr.xbrtoken.address,
        'XBRNetwork': xbr.xbrnetwork.address,
    }
};

exports.SimpleBlockchain = SimpleBlockchain;
