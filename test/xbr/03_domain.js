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

    // enum DomainStatus { NULL, ACTIVE, CLOSED }
    const DomainStatus_NULL = 0;
    const DomainStatus_ACTIVE = 1;
    const DomainStatus_CLOSED = 2;

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

    it('XBRNetwork.createDomain() : creating a domain by non-member should throw', async () => {

        const domainId = "0x9d9827822252fbe721d45224c7db7cac";
        const domainKey = "0xfeb083ce587a4ea72681d7db776452b05aaf58dc778534a6938313e4c85912f0";
        const license = "";
        const terms = "";
        const meta = "";

        try {
            await network.createDomain(domainId, domainKey, license, terms, meta, {from: alice, gasLimit: gasLimit});
            assert(false, "contract should throw here");
        } catch (error) {
            assert(/NOT_A_MEMBER/.test(error), "wrong error message");
        }
    });

    it('XBRNetwork.createDomain() : should create new domain, with correct attributes, and firing correct event', async () => {

        const eula = "QmU7Gizbre17x6V2VR1Q2GJEjz6m8S1bXmBtVxS2vmvb81";
        await network.register(eula, "", {from: alice, gasLimit: gasLimit});

        const domainId = "0x9d9827822252fbe721d45224c7db7cac";
        const domainKey = "0xfeb083ce587a4ea72681d7db776452b05aaf58dc778534a6938313e4c85912f0";
        const license = "";
        const terms = "";
        const meta = "";

        const txn = await network.createDomain(domainId, domainKey, license, terms, meta, {from: alice, gasLimit: gasLimit});

        const _status = await network.getDomainStatus(domainId);
        assert.equal(_status, DomainStatus_ACTIVE, "wrong domain status");

        const _owner = await network.getDomainOwner(domainId);
        assert.equal(_owner, alice, "wrong domain owner");

        const _domainKey = await network.getDomainKey(domainId);
        assert.equal(_domainKey, domainKey, "wrong domain domainKey");

        const _license = await network.getDomainLicense(domainId);
        assert.equal(_license, license, "wrong domain license");

        const _terms = await network.getDomainTerms(domainId);
        assert.equal(_terms, terms, "wrong domain termas");

        const _meta = await network.getDomainMeta(domainId);
        assert.equal(_meta, meta, "wrong domain meta");

        // check event logs
        assert.equal(txn.receipt.logs.length, 1, "event(s) we expected not emitted");
        const result = txn.receipt.logs[0];

        // check events
        assert.equal(result.event, "DomainCreated", "wrong event was emitted");

        // bytes16 domainId, uint32 domainSeq, DomainStatus status, address owner, bytes32 domainKey, string license, string terms, string meta

        // FIXME: we get this returend 0x9d9827822252fbe721d45224c7db7cac00000000000000000000000000000000
        //assert.equal(result.args.domainId, domainId, "wrong domainId in event");

        assert.equal(result.args.domainSeq, 1, "wrong domainSeq in event");
        assert.equal(result.args.status, DomainStatus_ACTIVE, "wrong status in event");
        assert.equal(result.args.owner, alice, "wrong owner in event");
        assert.equal(result.args.domainKey, domainKey, "wrong domainKey in event");
        assert.equal(result.args.license, license, "wrong license in event");
        assert.equal(result.args.terms, terms, "wrong terms in event");
        assert.equal(result.args.meta, meta, "wrong meta in event");
    });

    it('XBRNetwork.createDomain() : creating a duplicate domain should throw', async () => {

        const domainId = "0x9d9827822252fbe721d45224c7db7cac";
        const domainKey = "0xfeb083ce587a4ea72681d7db776452b05aaf58dc778534a6938313e4c85912f0";
        const license = "";
        const terms = "";
        const meta = "";

        try {
            await network.createDomain(domainId, domainKey, license, terms, meta, {from: alice, gasLimit: gasLimit});
            assert(false, "contract should throw here");
        } catch (error) {
            assert(/DOMAIN_ALREADY_EXISTS/.test(error), "wrong error message");
        }
    });

    it('XBRNetwork.pairNode() : pairing a node to non-existing domain should throw', async () => {

        const domainId = "0x88888888888888888888888888888888";
        const nodeId = "0x4570160dd5be4726b2a785499609d6ab";
        const nodeType = NodeType_EDGE;
        const nodeKey = "0x01e3d2c870c7c8b662990a79eb5fa65eb846e29c47a1ac412e07984d7c37112f";
        const config = "";

        try {
            await network.pairNode(nodeId, domainId, nodeType, nodeKey, config, {from: alice, gasLimit: gasLimit});
            assert(false, "contract should throw here");
        } catch (error) {
            assert(/NO_SUCH_DOMAIN/.test(error), "wrong error message");
        }
    });

    it('XBRNetwork.pairNode() : pairing a node with invalid node type should throw', async () => {

        const domainId = "0x9d9827822252fbe721d45224c7db7cac";
        const nodeId = "0x4570160dd5be4726b2a785499609d6ab";
        const nodeType = 0;
        const nodeKey = "0x01e3d2c870c7c8b662990a79eb5fa65eb846e29c47a1ac412e07984d7c37112f";
        const config = "";

        try {
            await network.pairNode(nodeId, domainId, nodeType, nodeKey, config, {from: alice, gasLimit: gasLimit});
            assert(false, "contract should throw here");
        } catch (error) {
            assert(/INVALID_NODE_TYPE/.test(error), "wrong error message");
        }
    });

    it('XBRNetwork.pairNode() : should pair node, store correct attributes, and fire event', async () => {

        const domainId = "0x9d9827822252fbe721d45224c7db7cac";
        const nodeId = "0x4570160dd5be4726b2a785499609d6ab";
        const nodeType = NodeType_EDGE;
        const nodeKey = "0x01e3d2c870c7c8b662990a79eb5fa65eb846e29c47a1ac412e07984d7c37112f";
        const config = "QmVz2ay78NXyoAiqd1N5EuKHhjBSzoF2GLxg6hURcM5UTa";

        // bytes16 nodeId, bytes16 domainId, NodeType nodeType, bytes32 nodeKey, string config
        const txn = await network.pairNode(nodeId, domainId, nodeType, nodeKey, config, {from: alice, gasLimit: gasLimit});

        _nodeId = await network.getNodeByKey(nodeKey);

        assert.equal(_nodeId, nodeId, "cannot find node by key");

        // check event logs
        assert.equal(txn.receipt.logs.length, 1, "event(s) we expected not emitted");
        const result = txn.receipt.logs[0];

        // check events
        assert.equal(result.event, "NodePaired", "wrong event was emitted");

        // bytes16 domainId, bytes16 nodeId, bytes32 nodeKey, string config

        // FIXME
        // assert.equal(result.args.domainId, domainId, "wrong domainId in event");
        assert.equal(result.args.nodeId, nodeId, "wrong nodeId in event");
        assert.equal(result.args.nodeKey, nodeKey, "wrong nodeKey in event");
        assert.equal(result.args.config, config, "wrong config in event");
    });

    it('XBRNetwork.pairNode() : pairing a node twice should throw', async () => {

        const domainId = "0x9d9827822252fbe721d45224c7db7cac";
        const nodeId = "0x4570160dd5be4726b2a785499609d6ab";
        const nodeType = NodeType_EDGE;
        const nodeKey = "0x01e3d2c870c7c8b662990a79eb5fa65eb846e29c47a1ac412e07984d7c37112f";
        const config = "";

        try {
            await network.pairNode(nodeId, domainId, nodeType, nodeKey, config, {from: alice, gasLimit: gasLimit});
            assert(false, "contract should throw here");
        } catch (error) {
            assert(/NODE_ALREADY_PAIRED/.test(error), "wrong error message");
        }
    });

    it('XBRNetwork.pairNode() : pairing nodes with same nodeKey should throw', async () => {

        const domainId = "0x9d9827822252fbe721d45224c7db7cac";
        const nodeId = "0xfa13540c112507feef74e49cab223df4";
        const nodeType = NodeType_EDGE;
        const nodeKey = "0x01e3d2c870c7c8b662990a79eb5fa65eb846e29c47a1ac412e07984d7c37112f";
        const config = "";

        try {
            await network.pairNode(nodeId, domainId, nodeType, nodeKey, config, {from: alice, gasLimit: gasLimit});
            assert(false, "contract should throw here");
        } catch (error) {
            assert(/DUPLICATE_NODE_KEY/.test(error), "wrong error message");
        }
    });

    it('XBRNetwork.releaseNode() : releasing a non-existant/unpaired node should throw', async () => {

        const nodeId = "0x88888888888888888888888888888888";

        try {
            await network.releaseNode(nodeId, {from: alice, gasLimit: gasLimit});
            assert(false, "contract should throw here");
        } catch (error) {
            assert(/NO_SUCH_NODE/.test(error), "wrong error message");
        }
    });

    it('XBRNetwork.releaseNode() : releasing a node from an account that is not domain owner should throw', async () => {

        const nodeId = "0x4570160dd5be4726b2a785499609d6ab";

        try {
            await network.releaseNode(nodeId, {from: bob, gasLimit: gasLimit});
            assert(false, "contract should throw here");
        } catch (error) {
            assert(/NOT_AUTHORIZED/.test(error), "wrong error message");
        }
    });

    it('XBRNetwork.closeDomain() : closing a domain should set domain status and fire correct event', async () => {

        const domainId = "0x9d9827822252fbe721d45224c7db7cac";

        const txn = await network.closeDomain(domainId, {from: alice, gasLimit: gasLimit});

        const _status = await network.getDomainStatus(domainId);
        assert.equal(_status, DomainStatus_CLOSED, "wrong domain status");

        // check event logs
        assert.equal(txn.receipt.logs.length, 1, "event(s) we expected not emitted");
        const result = txn.receipt.logs[0];

        // check events
        assert.equal(result.event, "DomainClosed", "wrong event was emitted");

        // bytes16 domainId, DomainStatus status

        // FIXME
        // assert.equal(result.args.domainId, domainId, "wrong domainId in event");
        assert.equal(result.args.status, DomainStatus_CLOSED, "wrong status in event");
    });

});
