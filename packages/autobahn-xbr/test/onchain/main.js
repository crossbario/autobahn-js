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

////////////////////

var xbr = autobahnXbr;
var xbrtoken = null;
var xbrnetwork = null;

// the XBR Project
window.addr_owner = '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1';

// 2 test XBR market owners
window.addr_alice = '0xffcf8fdee72ac11b5c542428b35eef5769c409f0';
window.addr_alice_market_maker1 = '0x22d491bde2303f2f43325b2108d26f1eaba1e32b';

window.addr_bob = '0xe11ba2b4d45eaed5996cd0823791e0c93114882d';
window.addr_bob_market_maker1 = '0xd03ea8624c8c5987235048901fb614fdca89b117';

// 2 test XBR data providers
window.addr_charlie = '0x95ced938f7991cd0dfcb48f0a06a40fa1af46ebc';
window.addr_charlie_provider_delegate1 = '0x3e5e9111ae8eb78fe1cc3bb8915d5d461f3ef9a9';

window.addr_donald = '0x28a8746e75304c0780e011bed21c72cd78cd535e';
window.addr_donald_provider_delegate1 = '0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e';

// 2 test XBR data consumers
window.addr_edith = '0x1df62f291b2e969fb0849d99d9ce41e2f137006e'
window.addr_edith_provider_delegate1 = '0x610bb1573d1046fcb8a70bbbd395754cd57c2b60';

window.addr_frank = '0x855fa758c77d68a04990e992aa4dcdef899f654a';
window.addr_frank_provider_delegate1 = '0xfa2435eacf10ca62ae6787ba2fb044f8733ee843';

////////////////////

var metamask_account = null;
var metamask_network = null;


// demo app entry point
window.addEventListener('load', function () {
    unlock_metamask();
});


// check for MetaMask and ask user to grant access to accounts ..
// https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
// web3.currentProvider.isMetaMask
async function unlock_metamask () {
    if (window.ethereum) {
            // if we have MetaMask, ask user for access
        await ethereum.enable();

        // instantiate Web3 from MetaMask as provider
        //window.web3 = new Web3(window.ethereum);
        window.web3 = new Web3(window.ethereum);
        console.log('ok, user granted access to MetaMask accounts');

        web3.currentProvider.publicConfigStore.on('update', on_metamask_changed);

        // set new provider on XBR library
        await xbr.setProvider(window.web3.currentProvider);
        xbrtoken = await xbr.xbrtoken;
        xbrnetwork = await xbr.xbrnetwork;
        console.log('library versions: web3="' + window.web3.version.api + '", xbr="' + xbr.version + '"');
    } else {
        // no MetaMask (or other modern Ethereum integrated browser) .. redirect
        var win = window.open('https://metamask.io/', '_blank');
        if (win) {
            win.focus();
        }
    }
}


function on_metamask_changed (changed) {
    if (metamask_account != changed.selectedAddress || metamask_network != changed.networkVersion) {
        metamask_account = changed.selectedAddress;
        metamask_network = changed.networkVersion;
        console.log('user switched account to ' + metamask_account + ' on network ' + changed.networkVersion);

        // now setup testing from the accounts ..
        setup_test(metamask_account);
    }
}


// setup test
async function setup_test (account) {
    console.log('*************** setup testing for account ' + account);

    // display addresses of XBR smart contract instances
    document.getElementById('account').innerHTML = '' + account;
    document.getElementById('xbr_network_address').innerHTML = '' + xbrnetwork.address;
    document.getElementById('xbr_token_address').innerHTML = '' + xbrtoken.address;

    // set main account as default in form elements
    document.getElementById('new_member_address').value = '' + account;
    document.getElementById('get_member_address').value = '' + account;
    document.getElementById('get_market_actor_address').value = '' + account;

    // const market_adr = '0xa1b8d6741ae8492017fafd8d4f8b67a2';
    const market_adr = '0x00000000000000000000000000000000';

    document.getElementById('get_market_market_adr').value = '' + market_adr;
    document.getElementById('join_market_market_adr').value = '' + market_adr;
    document.getElementById('get_market_actor_market_adr').value = '' + market_adr;
    document.getElementById('open_channel_market_adr').value = '' + market_adr;
    document.getElementById('new_market_maker_address').value = '' + market_adr;
}


async function test_get_member () {
    var get_member_address = document.getElementById('get_member_address').value;

    // ask for current balance in XBR
    var balance = await xbrtoken.balanceOf(get_member_address);
    if (balance > 0) {
        balance = balance / 10**18;
        console.log('account holds ' + balance + ' XBR');
    } else {
        console.log('account does not hold XBR currently');
    }

    // ask for XBR network membership level
    const member = await xbrnetwork.members(get_member_address);
    const level = member.level.toNumber();
    if (level > 0) {
        console.log('account is already member in the XBR network (level=' + level + ')');
        const eula = member.eula;
        const profile = member.profile;
        console.log('eula:', eula);
        console.log('profile:', profile);
    } else {
        console.log('account is not yet member in the XBR network');
    }
}


async function test_register () {
    const new_member_address = document.getElementById('new_member_address').value;
    const new_member_eula = document.getElementById('new_member_eula').value;
    const new_member_profile = document.getElementById('new_member_profile').value;

    console.log('test_register(new_member_address=' + new_member_address + ', new_member_eula=' + new_member_eula + ', new_member_profile=' + new_member_profile + ')');

    // bytes32 eula, bytes32 profile
    console.log(xbr, xbrnetwork, xbrnetwork.register);
    await xbrnetwork.register(new_member_eula, new_member_profile, {from: metamask_account});
}


async function test_create_market () {
    const decimals = parseInt('' + await xbrtoken.decimals())

    var terms = document.getElementById('new_market_terms').value;
    var meta = document.getElementById('new_market_meta').value;
    var maker = document.getElementById('new_market_maker_address').value;
    var providerSecurity = parseInt(document.getElementById('new_market_provider_security').value);
    var consumerSecurity = parseInt(document.getElementById('new_market_consumer_security').value);
    var marketFee = document.getElementById('new_market_fee').value;

    providerSecurity = providerSecurity * (10 ** decimals);
    consumerSecurity = consumerSecurity * (10 ** decimals);
    marketFee = marketFee * (10 ** decimals);

    var marketId = web3.sha3((account, name));

    console.log('test_create_market(marketId=' + marketId + ', maker=' + maker + ', terms=' + terms + ', providerSecurity=' + providerSecurity + ', consumerSecurity=' + consumerSecurity + ', marketFee=' + marketFee + ')');

    // function createMarket
    //      (bytes16 marketId, string memory terms, string memory meta, address maker,
    //       uint256 providerSecurity, uint256 consumerSecurity, uint256 marketFee)
    //
    await xbrnetwork.createMarket(marketId, terms, meta, maker, 0, 0, 0, {from: metamask_account});

    // FIXME: number/token conversion
    // await xbrnetwork.createMarket(marketId, terms, meta, maker, providerSecurity, consumerSecurity, marketFee, {from: metamask_account});
}


async function test_get_market () {
    const totalSupply = parseInt('' + await xbrtoken.totalSupply())
    const decimals = parseInt('' + await xbrtoken.decimals())

    // 0xa1b8d6741ae8492017fafd8d4f8b67a2
    var marketId = document.getElementById('get_market_market_adr').value;

    console.log('test_get_market(marketId=' + marketId + ')');

    const market = await xbrnetwork.markets(marketId);

    const created = market.created.toNumber();
    const marketSeq = market.marketSeq.toNumber();
    const owner = market.owner;
    const terms = market.terms;
    const meta = market.meta;
    const maker = market.maker;
    var providerSecurity = market.providerSecurity;
    var consumerSecurity = market.consumerSecurity;
    var marketFee = market.marketFee;

    providerSecurity = providerSecurity / (10 ** decimals);
    consumerSecurity = consumerSecurity / (10 ** decimals);
    marketFee = marketFee / totalSupply;

    console.log('market ' + marketId + ' created:', created);
    console.log('market ' + marketId + ' marketSeq:', marketSeq);
    console.log('market ' + marketId + ' owner:', owner);
    console.log('market ' + marketId + ' terms:', terms);
    console.log('market ' + marketId + ' meta:', meta);
    console.log('market ' + marketId + ' maker:', maker);
    console.log('market ' + marketId + ' providerSecurity:', providerSecurity);
    console.log('market ' + marketId + ' consumerSecurity:', consumerSecurity);
    console.log('market ' + marketId + ' marketFee:', marketFee);
}


async function test_join_market () {
    // 0xa1b8d6741ae8492017fafd8d4f8b67a2
    var marketId = document.getElementById('join_market_market_adr').value;

    var actorType = xbr.ActorType.NONE;
    if (document.getElementById('join_market_actor_type_provider').checked) {
        // actorType = xbr.ActorType.PROVIDER;
        actorType = 1;
    }
    else if (document.getElementById('join_market_actor_type_consumer').checked) {
        // actorType = xbr.ActorType.CONSUMER;
        actorType = 2;
    }
    else {
        assert(false);
    }

    console.log('test_join_market(marketId=' + marketId + ', actorType=' + actorType + ')');

    const meta = "";

    // bytes32 marketId, ActorType actorType
    await xbrnetwork.joinMarket(marketId, actorType, meta, {from: metamask_account, gas: 1000000});
}


async function test_get_market_actor_type () {
    // 0xa1b8d6741ae8492017fafd8d4f8b67a2
    var marketId = document.getElementById('get_market_actor_market_adr').value;
    var actor = document.getElementById('get_market_actor_address').value;

    // PROVIDER: joined, security, meta
    const provider_actor = await xbrnetwork.getMarketActor(marketId, actor, 1);
    console.log("PROVIDER: joined=" + provider_actor[0].toNumber(), "security=" + provider_actor[1].toNumber(), "meta=" + provider_actor[2]);

    // CONSUMER: joined, security, meta
    const consumer_actor = await xbrnetwork.getMarketActor(marketId, actor, 2);
    console.log("CONSUMER: joined=" + consumer_actor[0].toNumber(), "security=" + consumer_actor[1].toNumber(), "meta=" + consumer_actor[2]);
}


async function test_open_payment_channel () {
    console.log('test_open_payment_channel() ...');

    // 0xa1b8d6741ae8492017fafd8d4f8b67a2
    const marketId = document.getElementById('open_channel_market_adr').value;
    const recipient = document.getElementById('open_channel_recipient_address').value;
    const delegate = document.getElementById('open_channel_consumer_address').value;

    var amount = document.getElementById('open_channel_amount').value;
    const decimals = parseInt('' + await xbrtoken.decimals())
    amount = String(amount) + String(10 ** decimals).substring(1);

    const timeout = 0;

    console.log('market, recipient, delegate, amount, timeout', marketId, recipient, delegate, amount, timeout);

    const success = await xbrtoken.approve(xbrnetwork.address, amount, {from: metamask_account});

    if (!success) {
        throw 'transfer was not approved';
    }

    var watch = {
        tx: null
    }

    const options = {};
    xbrnetwork.ChannelCreated(options, function (error, event)
        {
            console.log('ChannelCreated', event);
            if (event) {
                if (watch.tx && event.transactionHash == watch.tx) {
                    console.log('new payment channel created: marketId=' + event.args.marketId + ', channel=' + event.args.channel + '');
                }
            }
            else {
                console.error(error);
            }
        }
    );

    console.log('test_open_payment_channel(marketId=' + marketId + ', delegate=' + delegate + ', amount=' + amount + ')');

    // bytes32 marketId, address consumer, uint256 amount
    const tx = await xbrnetwork.openPaymentChannel(marketId, recipient, delegate, amount, timeout, {from: metamask_account, gas: 6900000});

    console.log(tx);

    watch.tx = tx.tx;

    console.log('transaction completed: tx=' + tx.tx + ', gasUsed=' + tx.receipt.gasUsed);
}


async function test_get_payment_channel () {
    const channelAddress = document.getElementById('get_channel_channel_address').value;

    channel = await xbr.XBRChannel.at(channelAddress);

    console.log(channel);

    const organization = await channel.organization();
    const network = await channel.network();

    const marketId = await channel.marketId();
    const marketmaker = await channel.marketmaker();
    const sender = await channel.sender();
    const delegate = await channel.delegate();
    const recipient = await channel.recipient();

    const amount = await channel.amount();
    const timeout = await channel.timeout();

    const openedAt = await channel.openedAt();
    const closedAt = await channel.closedAt();
    const closingAt = await channel.closingAt();

    const ctype = await channel.ctype();
    const state = await channel.state();

    console.log('organization=' + organization);
    console.log('network=' + network);
    console.log('marketId=' + marketId);
    console.log('marketmaker=' + marketmaker);
    console.log('sender=' + sender);
    console.log('delegate=' + delegate);
    console.log('recipient=' + recipient);

    console.log('amount=' + amount);
    console.log('timeout=' + timeout);

    console.log('openedAt=' + openedAt);
    console.log('closingAt=' + closingAt);
    console.log('closedAt=' + closedAt);

    console.log('ctype=' + ctype);
    console.log('state=' + state);
}


async function test_request_paying_channel () {
    console.log('test_request_paying_channel() ...');

    const marketId = document.getElementById('open_paying_channel_market_adr').value;
    const delegate = document.getElementById('open_paying_channel_delegate_address').value;
    const recipient = document.getElementById('open_paying_channel_recipient_address').value;
    var amount = document.getElementById('open_paying_channel_amount').value;
    const decimals = parseInt('' + await xbrtoken.decimals())
    amount = String(amount) + String(10 ** decimals).substring(1);
    const timeout = 0;

    console.log('marketId, recipient, delegate, amount, timeout', marketId, recipient, delegate, amount, timeout);

    // const success = await xbrtoken.approve(xbrnetwork.address, amount, {from: metamask_account});
    const success = true;

    if (!success) {
        throw 'transfer was not approved';
    }

    var watch = {
        tx: null
    }

    const options = {};
    xbrnetwork.PayingChannelRequestCreated(options, function (error, event)
        {
            console.log('PayingChannelRequestCreated', event);
            if (event) {
                if (watch.tx && event.transactionHash == watch.tx) {
                    console.log('new paying channel request created: marketId=' + event.args.marketId + ', channel=' + event.args.channel + '');
                }
            }
            else {
                console.error(error);
            }
        }
    );

    console.log('requestPayingChannel(marketId=' + marketId + ', delegate=' + delegate + ', amount=' + amount + ')');

    // bytes32 marketId, address provider, uint256 amount
    const tx = await xbrnetwork.requestPayingChannel(marketId, recipient, delegate, amount, timeout, {from: metamask_account});

    console.log(tx);

    watch.tx = tx.tx;

    console.log('transaction completed: tx=' + tx.tx + ', gasUsed=' + tx.receipt.gasUsed);
}


async function test_open_paying_channel () {
    console.log('test_open_paying_channel() ...');

    const marketId = document.getElementById('open_paying_channel_market_adr').value;
    const recipient = document.getElementById('open_paying_channel_recipient_address').value;
    const delegate = document.getElementById('open_paying_channel_consumer_address').value;

    var amount = document.getElementById('open_paying_channel_amount').value;
    const decimals = parseInt('' + await xbrtoken.decimals())
    amount = String(amount) + String(10 ** decimals).substring(1);

    const timeout = 0;

    console.log('market, recipient, delegate, amount, timeout', marketId, recipient, delegate, amount, timeout);

    const success = await xbrtoken.approve(xbrnetwork.address, amount, {from: metamask_account});

    if (!success) {
        throw 'transfer was not approved';
    }

    var watch = {
        tx: null
    }

    const options = {};
    xbrnetwork.ChannelCreated(options, function (error, event)
        {
            console.log('ChannelCreated', event);
            if (event) {
                if (watch.tx && event.transactionHash == watch.tx) {
                    console.log('new paying channel created: marketId=' + event.args.marketId + ', channel=' + event.args.channel + '');
                }
            }
            else {
                console.error(error);
            }
        }
    );

    console.log('test_open_paying_channel(marketId=' + marketId + ', delegate=' + delegate + ', amount=' + amount + ')');

    // bytes32 marketId, address consumer, uint256 amount
    const tx = await xbrnetwork.openPayingChannel(marketId, recipient, delegate, amount, timeout, {from: metamask_account, gas: 6900000});

    console.log(tx);

    watch.tx = tx.tx;

    console.log('transaction completed: tx=' + tx.tx + ', gasUsed=' + tx.receipt.gasUsed);
}


async function test_get_paying_channel () {
    const channelAddress = document.getElementById('get_paying_channel_address').value;

    channel = await xbr.XBRChannel.at(channelAddress);

    console.log(channel);

    const organization = await channel.organization();
    const network = await channel.network();

    const marketId = await channel.marketId();
    const marketmaker = await channel.marketmaker();
    const sender = await channel.sender();
    const delegate = await channel.delegate();
    const recipient = await channel.recipient();

    const amount = await channel.amount();
    const timeout = await channel.timeout();

    const openedAt = await channel.openedAt();
    const closedAt = await channel.closedAt();
    const closingAt = await channel.closingAt();

    const ctype = await channel.ctype();
    const state = await channel.state();

    console.log('organization=' + organization);
    console.log('network=' + network);
    console.log('marketId=' + marketId);
    console.log('marketmaker=' + marketmaker);
    console.log('sender=' + sender);
    console.log('delegate=' + delegate);
    console.log('recipient=' + recipient);

    console.log('amount=' + amount);
    console.log('timeout=' + timeout);

    console.log('openedAt=' + openedAt);
    console.log('closingAt=' + closingAt);
    console.log('closedAt=' + closedAt);

    console.log('ctype=' + ctype);
    console.log('state=' + state);
}
