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

const web3 = require("web3");
var XBRToken = artifacts.require("./XBRToken.sol");


contract('XBRToken', function (accounts) {

    //const gasLimit = 6721975;
    const gasLimit = 0xfffffffffff;
    //const gasLimit = 100000000;

    XBR_TOTAL_SUPPLY = 10**9 * 10**18;

    it("XBRToken() : should have produced the right initial supply of XBRToken", function () {
        return XBRToken.deployed().then(function (instance) {
            return instance.totalSupply.call();
        }).then(function (supply) {
            assert.equal(supply.valueOf(), XBR_TOTAL_SUPPLY, "Wront initial supply for token");
        });
    });

    it("XBRToken() : should initially put all XBRToken in the first account", function () {
        return XBRToken.deployed().then(function (instance) {
            return instance.balanceOf.call(accounts[0]);
        }).then(function (balance) {
            assert.equal(balance.valueOf(), XBR_TOTAL_SUPPLY, "Initial supply wasn't allocated to the first account");
        });
    });
});
