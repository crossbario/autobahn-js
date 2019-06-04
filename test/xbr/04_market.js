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

    it('XBRNetwork.createMarket() : should create new market', async () => {

        if (false) {
            const eula = "QmU7Gizbre17x6V2VR1Q2GJEjz6m8S1bXmBtVxS2vmvb81";
            const profile = "QmQMtxYtLQkirCsVmc3YSTFQWXHkwcASMnu5msezGEwHLT";

            await network.register(eula, profile, {from: alice, gasLimit: gasLimit});
        }

        const marketId = utils.sha3("MyMarket1").substring(0, 34);
        const maker = alice_market_maker1;

        const terms = "";
        const meta = "";

        // 100 XBR security
        const providerSecurity = '' + 100 * 10**18;
        const consumerSecurity = '' + 100 * 10**18;

        // 5% market fee
        // FIXME: how to write a large uint256 literal?
        // const marketFee = '' + Math.trunc(0.05 * 10**9 * 10**18);
        const marketFee = 0;

        await network.createMarket(marketId, terms, meta, maker, providerSecurity, consumerSecurity, marketFee, {from: alice, gasLimit: gasLimit});
    });

    it('XBRNetwork.joinMarket() : provider should join existing market', async () => {

        // the XBR provider we use here
        const provider = bob;

        // 100 XBR security
        const providerSecurity = '100000000000000000000';

        // XBR market to join
        const marketId = utils.sha3("MyMarket1").substring(0, 34);

        // remember XBR token balance of network contract before joining market
        const _balance_network_before = await token.balanceOf(network.address);

        // transfer 1000 XBR to provider
        await token.transfer(provider, '1000000000000000000000', {from: owner, gasLimit: gasLimit});

        // approve transfer of tokens to join market
        await token.approve(network.address, providerSecurity, {from: provider, gasLimit: gasLimit});

        // XBR provider joins market
        const txn = await network.joinMarket(marketId, ActorType_PROVIDER, {from: provider, gasLimit: gasLimit});

        // check event logs
        assert.equal(txn.receipt.logs.length, 1, "event(s) we expected not emitted");
        const result = txn.receipt.logs[0];

        // check events
        assert.equal(result.event, "ActorJoined", "wrong event was emitted");

        // FIXME
        // assert.equal(result.args.marketId, marketId, "wrong marketId in event");
        assert.equal(result.args.actor, provider, "wrong provider address in event");
        assert.equal(result.args.actorType, ActorType_PROVIDER, "wrong actorType in event");
        assert.equal(result.args.security, providerSecurity, "wrong providerSecurity in event");

        const _actorType = await network.getMarketActorType(marketId, provider);
        assert.equal(_actorType.toNumber(), ActorType_PROVIDER, "wrong actorType " + _actorType);

        const _security = await network.getMarketActorSecurity(marketId, provider);
        assert.equal(_security, providerSecurity, "wrong providerSecurity " + _security);

        const _balance_actor = await token.balanceOf(provider);
        assert.equal(_balance_actor.valueOf(), 900 * 10**18, "market security wasn't transferred _from_ provider");

        // check that the network contract as gotten the security
        const _balance_network_after = await token.balanceOf(network.address);
        assert.equal(_balance_network_after.valueOf() - _balance_network_before.valueOf(),
                     providerSecurity, "market security wasn't transferred _to_ network contract");
    });

    it('XBRNetwork.joinMarket() : consumer should join existing market', async () => {

        // the XBR consumer we use here
        const consumer = charlie;

        // 100 XBR security
        const consumerSecurity = '100000000000000000000';

        // XBR market to join
        const marketId = utils.sha3("MyMarket1").substring(0, 34);

        // remember XBR token balance of network contract before joining market
        const _balance_network_before = await token.balanceOf(network.address);

        // transfer 1000 XBR to consumer
        await token.transfer(consumer, '1000000000000000000000', {from: owner, gasLimit: gasLimit});

        // approve transfer of tokens to join market
        await token.approve(network.address, consumerSecurity, {from: consumer, gasLimit: gasLimit});

        // XBR consumer joins market
        const txn = await network.joinMarket(marketId, ActorType_CONSUMER, {from: consumer, gasLimit: gasLimit});

        // check event logs
        assert.equal(txn.receipt.logs.length, 1, "event(s) we expected not emitted");
        const result = txn.receipt.logs[0];

        // check events
        assert.equal(result.event, "ActorJoined", "wrong event was emitted");
        // FIXME
        //assert.equal(result.args.marketId, marketId, "wrong marketId in event");
        assert.equal(result.args.actor, consumer, "wrong consumer address in event");
        assert.equal(result.args.actorType, ActorType_CONSUMER, "wrong actorType in event");
        assert.equal(result.args.security, consumerSecurity, "wrong consumerSecurity in event");

        const _actorType = await network.getMarketActorType(marketId, consumer);
        assert.equal(_actorType.toNumber(), ActorType_CONSUMER, "wrong actorType " + _actorType);

        const _security = await network.getMarketActorSecurity(marketId, consumer);
        assert.equal(_security, consumerSecurity, "wrong consumerSecurity " + _security);

        const _balance_actor = await token.balanceOf(consumer);
        assert.equal(_balance_actor.valueOf(), 900 * 10**18, "market security wasn't transferred _from_ consumer");

        // check that the network contract as gotten the security
        const _balance_network_after = await token.balanceOf(network.address);
        assert.equal(_balance_network_after.valueOf() - _balance_network_before.valueOf(),
                     consumerSecurity, "market security wasn't transferred _to_ network contract");
    });

    it('XBRNetwork.openPaymentChannel() : consumer should open payment channel', async () => {

        // openPaymentChannel (bytes16 marketId, address consumer, uint256 amount)

        // the XBR consumer we use here
        const market = alice;
        const consumer = charlie;
        const delegate = charlie_provider_delegate1;

        // XBR market to join
        const marketId = utils.sha3("MyMarket1").substring(0, 34);

        // 50 XBR security
        const amount = '50000000000000000000';

        // approve transfer of tokens to open payment channel
        await token.approve(network.address, amount, {from: consumer, gasLimit: gasLimit});

        // XBR consumer opens a payment channel in the market
        const txn = await network.openPaymentChannel(marketId, consumer, amount, {from: consumer, gasLimit: gasLimit});

        // check event logs
        assert.equal(txn.receipt.logs.length, 1, "event(s) we expected not emitted");
        const result = txn.receipt.logs[0];

        // check events
        assert.equal(result.event, "PaymentChannelCreated", "wrong event was emitted");

        // bytes16 marketId, address sender, address delegate, address receiver, address channel
        // FIXME
        //assert.equal(result.args.marketId, marketId, "wrong marketId in event");
        assert.equal(result.args.sender, consumer, "wrong sender address in event");
        //assert.equal(result.args.delegate, delegate, "wrong delegate address in event");
        assert.equal(result.args.receiver, market, "wrong receiver address in event");
        //assert.equal(result.args.channel, consumerSecurity, "wrong consumerSecurity in event");
    });

});
