var assert = require('assert');
var web3 = require('web3');

// https://web3js.readthedocs.io/en/v1.2.0/web3-utils.html#bn
// https://github.com/indutny/bn.js/
var BN = web3.utils.BN;

const nl = {
    '0': '0x0000000000000000000000000000000000000000000000000000000000000000',
    '1': '0x0000000000000000000000000000000000000000000000000000000000000001',
    '9007199254740992': '0x0000000000000000000000000000000000000000000000000020000000000000',
    '1000000000000000000': '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
    '999000000000000000000': '0x00000000000000000000000000000000000000000000003627e8f712373c0000',
    '1000000000000000000000000000': '0x0000000000000000000000000000000000000000033b2e3c9fd0803ce8000000',
    '115792089237316195423570985008687907853269984665640564039457584007913129639935': '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
}

for (const [key, value] of Object.entries(nl)) {
    console.log(value, key);

    const n = new BN(key);
    const x = n.toBuffer('big', 32);
    assert.equal('0x' + x.toString('hex'), value);

    const n2 = new BN(x);
    assert.equal(n2.cmp(n), 0);
}


/*
var BigNumber = require('bignumber.js');
var eth_util = require("ethereumjs-util");

var nr = new BigNumber('35000000000000000000');

console.log(nr);
console.log(nr.toString());
console.log(nr.toString(16));

var nr2 = new BN('35000000000000000000');

console.log(nr2);

console.log(web3.utils.toHex(nr2));

console.log(web3.utils.padLeft(web3.utils.toHex(nr2), 64));

console.log(eth_util.toBuffer(web3.utils.padLeft(web3.utils.toHex(nr2), 32)));

console.log(nr2.toBuffer('big', 32));
*/