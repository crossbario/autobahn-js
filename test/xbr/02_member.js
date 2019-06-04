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
const utils = require("./utils.js");

const XBRNetwork = artifacts.require("./XBRNetwork.sol");
const XBRToken = artifacts.require("./XBRToken.sol");


contract('XBRNetwork', accounts => {

    //const gasLimit = 6721975;
    const gasLimit = 0xfffffffffff;
    //const gasLimit = 100000000;

    // deployed instance of XBRNetwork
    var network;

    // deployed instance of XBRNetwork
    var token;

    // https://solidity.readthedocs.io/en/latest/frequently-asked-questions.html#if-i-return-an-enum-i-only-get-integer-values-in-web3-js-how-to-get-the-named-values

    // enum MemberLevel { NULL, ACTIVE, VERIFIED, RETIRED, PENALTY, BLOCKED }
    const MemberLevel_NULL = 0;
    const MemberLevel_ACTIVE = 1;
    const MemberLevel_VERIFIED = 2;
    const MemberLevel_RETIRED = 3;
    const MemberLevel_PENALTY = 4;
    const MemberLevel_BLOCKED = 5;

    // enum DomainStatus { NULL, ACTIVE, CLOSED }
    const DomainStatus_NULL = 0;
    const DomainStatus_ACTIVE = 1;
    const DomainStatus_CLOSED = 2;

    // enum ActorType { NULL, NETWORK, MARKET, PROVIDER, CONSUMER }
    const ActorType_NULL = 0;
    const ActorType_NETWORK = 1;
    const ActorType_MARKET = 2;
    const ActorType_PROVIDER = 3;
    const ActorType_CONSUMER = 4;

    // enum NodeType { NULL, MASTER, CORE, EDGE }
    const NodeType_NULL = 0;
    const NodeType_MASTER = 1;
    const NodeType_CORE = 2;
    const NodeType_EDGE = 3;

    //
    // test accounts setup
    //

    // the XBR Project
    const owner = accounts[0];

    // 2 test XBR market owners
    const alice = accounts[1];
    const alice_market_maker1 = accounts[2];

    const bob = accounts[3];
    const bob_market_maker1 = accounts[4];

    // 2 test XBR data providers
    const charlie = accounts[5];
    const charlie_provider_delegate1 = accounts[6];

    const donald = accounts[7];
    const donald_provider_delegate1 = accounts[8];

    // 2 test XBR data consumers
    const edith = accounts[9];
    const edith_provider_delegate1 = accounts[10];

    const frank = accounts[11];
    const frank_provider_delegate1 = accounts[12];

    beforeEach('setup contract for each test', async function () {
        network = await XBRNetwork.deployed();
        token = await XBRToken.deployed();
    });

    /*
    afterEach(function (done) {
    });
    */

    it('XBRNetwork() : network organization should be the owner', async () => {
        const _organization = await network.organization();

        assert.equal(_organization, owner, "network organization was initialized correctly");
    });

    it('XBRNetwork() : token should be the network token', async () => {
        const _token = await network.token();

        assert.equal(_token, token.address, "network token was initialized correctly");
    });

    it('XBRNetwork() : owner account should be initially registered', async () => {

        const level = await network.getMemberLevel(owner);

        assert.equal(level.toNumber(), MemberLevel_VERIFIED, "wrong member level");
    });

    it('XBRNetwork() : non-owner accounts should be initially unregistered', async () => {
        //const network = await XBRNetwork.deployed();

        var level;

        level = await network.getMemberLevel(alice);
        assert.equal(level.toNumber(), MemberLevel_NULL, "wrong member level " + level);

        level = await network.getMemberLevel(bob);
        assert.equal(level.toNumber(), MemberLevel_NULL, "wrong member level " + level);

        level = await network.getMemberLevel(charlie);
        assert.equal(level.toNumber(), MemberLevel_NULL, "wrong member level " + level);

        level = await network.getMemberLevel(donald);
        assert.equal(level.toNumber(), MemberLevel_NULL, "wrong member level " + level);

        level = await network.getMemberLevel(edith);
        assert.equal(level.toNumber(), MemberLevel_NULL, "wrong member level " + level);

        level = await network.getMemberLevel(frank);
        assert.equal(level.toNumber(), MemberLevel_NULL, "wrong member level " + level);
    });

    it('XBRNetwork.register() : registering a member with wrong EULA should throw', async () => {

        const eula = "invalid";
        const profile = "foobar";

        try {
            await network.register(eula, profile, {from: alice, gasLimit: gasLimit});
            assert(false, "contract should throw here");
        } catch (error) {
            assert(/INVALID_EULA/.test(error), "wrong error message: " + error);
        }
    });

    it('XBRNetwork.register() : should create new member with the correct attributes stored, and firing correct event', async () => {

        const eula = "QmU7Gizbre17x6V2VR1Q2GJEjz6m8S1bXmBtVxS2vmvb81";
        const profile = "QmQMtxYtLQkirCsVmc3YSTFQWXHkwcASMnu5msezGEwHLT";

        const txn = await network.register(eula, profile, {from: alice, gasLimit: gasLimit});

        const _level = await network.getMemberLevel(alice);
        assert.equal(_level.toNumber(), MemberLevel_ACTIVE, "wrong member level");

        const _eula = await network.getMemberEula(alice);
        assert.equal(_eula, eula, "wrong member EULA");

        const _profile = await network.getMemberProfile(alice);
        assert.equal(_eula, eula, "wrong member Profile");

        // check event logs
        assert.equal(txn.receipt.logs.length, 1, "event(s) we expected not emitted");
        const result = txn.receipt.logs[0];

        // check events
        assert.equal(result.event, "MemberCreated", "wrong event was emitted");
        assert.equal(result.args.member, alice, "wrong member address in event");
        assert.equal(result.args.eula, eula, "wrong member EULA in event");
        assert.equal(result.args.profile, profile, "wrong member Profile in event");
        assert.equal(result.args.level, MemberLevel_ACTIVE, "wrong member level in event");
    });

    it('XBRNetwork.register() : registering a member twice should throw', async () => {

        const eula = "QmU7Gizbre17x6V2VR1Q2GJEjz6m8S1bXmBtVxS2vmvb81";
        const profile = "";

        try {
            await network.register(eula, profile, {from: alice, gasLimit: gasLimit});
            assert(false, "contract should throw here");
        } catch (error) {
            assert(/MEMBER_ALREADY_REGISTERED/.test(error), "wrong error message: " + JSON.stringify(error));
        }
    });

    it('XBRNetwork.unregister() : retiring a member should fire the correct event and store the correct member level', async () => {

        const txn = await network.unregister({from: alice, gasLimit: gasLimit});

        const _level = await network.getMemberLevel(alice);
        assert.equal(_level.toNumber(), MemberLevel_RETIRED, "wrong member level");

        // check event logs
        assert.equal(txn.receipt.logs.length, 1, "event(s) we expected not emitted");
        const result = txn.receipt.logs[0];

        // check events
        assert.equal(result.event, "MemberRetired", "wrong event was emitted");
        assert.equal(result.args.member, alice, "wrong member address in event");
    });

});
