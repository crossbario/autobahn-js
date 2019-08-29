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

var Web3 = require("web3");
var xbr = require('./autobahn-xbr');

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

exports.SimpleBlockchain = SimpleBlockchain;
