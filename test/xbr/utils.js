// https://gist.github.com/naps62/e987323357fb7630871eb293e0308c36
function mine_tx (txhash, interval) {
    return new Promise((resolve, reject) => {
        const getReceipt = () => {
            web3.eth.getTransactionReceipt(txhash, (error, receipt) => {
                if (error) {
                    reject(error);
                } else if (receipt) {
                    resolve(receipt);
                } else {
                    setTimeout(getReceipt, interval || 500);
                }
            })
        };
        getReceipt();
      });
}

// https://github.com/OpenZeppelin/openzeppelin-solidity/blob/f4228f1b49d6d505d3311e5d962dfb0febdf61df/test/Bounty.test.js#L12
function await_event (event, handler) {
    return new Promise((resolve, reject) => {
        function wrappedHandler (...args) {
            Promise.resolve(handler(...args)).then(resolve).catch(reject);
        }
        event.watch(wrappedHandler);
    });
}

module.exports = {
    mine_tx: mine_tx,
    await_event: await_event
};

// https://ethereum.stackexchange.com/a/38197
if (web3.utils && web3.utils) {
    module.exports.sha3 = web3.utils.sha3;
} else if (web3 && web3.sha3) {
    module.exports.sha3 = web3.sha3;
} else {
    module.exports.sha3 = null;
}
