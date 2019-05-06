const eth_accounts = require("web3-eth-accounts");
const eth_util = require("ethereumjs-util");

var start = function (session) {
    console.log(session);
};

var Seller = function (buyerKey, maxPrice) {
    this.buyerKey = buyerKey;
    this.maxPrice = maxPrice;
    this.start = start;
    const accounts = new eth_accounts.Accounts();
    const pubKey = eth_util.privateToPublic(buyerKey);
    const account = accounts.privateKeyToAccount(buyerKey);
    const addr = new Buffer(account.address);
    const privateKey = new Buffer(account.privateKey);
    const _keys = {};
    const _keys_map = {};

    this._session = null;
    this._session_regs = null;

    console.log(privateKey);
    console.log(addr);
    console.log(pubKey);
    console.log(account.address);
    console.log(account.privateKey);

    // console.log(accounts.eth.accounts.privateKeyToAccount("asdasdas"));
    // const account = accounts.eth.accounts.privateKeyToAccount("asdas");
    // account.
};

exports.SimpleSeller = Seller;
