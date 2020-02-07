/**
 * Unit test to make sure objects from vm instances also pass object checks
 */

var autobahn = require('../index.js');
var testutil = require('./testutil.js');
var vm = require('vm');

// It should pass for objects
exports.utilIsObjectSucceed = function (testcase) {
    testcase.expect(1);
    var test = new testutil.Testlog("test/test_util_is_object_success.txt");
    const obj = {foo: 'bar'};
    var isObj = autobahn.util.is_object(obj);
    test.log(isObj);
    var chk = test.check();
    testcase.ok(!chk, chk);
    testcase.done();
};

// It should fail for scalars and arrays
exports.utilIsObjectFail = function (testcase) {
    testcase.expect(1);
    const invalids = [1, [], 'string'];
    var test = new testutil.Testlog("test/test_util_is_object_fail.txt");
    for (var k in invalids) {
        var obj = invalids[k];
        var isObj = autobahn.util.is_object(obj);
        test.log(isObj);
    }
    var chk = test.check();
    testcase.ok(!chk, chk);
    testcase.done();
};


exports.utilIsObjectVmFail = function (testcase) {
    testcase.expect(1);
    var context = {kwargs: {foo: 'bar'}, isObj: false};
    vm.createContext(context);
    var code = 'kwargs.baz = \'bax\'; isObj = kwargs instanceof Object';
    vm.runInContext(code, context);
    testcase.ok(!context.isObj, 'instanceof checks inside VMs should fail');
    testcase.done();
};

// It should pass for checks executed in a VM
exports.utilIsObjectVmSucceed = function (testcase) {
    testcase.expect(1);
    var test = new testutil.Testlog("test/test_util_is_object_vm.txt");

    var context = {kwargs: {foo: 'bar'}, isObj: false};
    vm.createContext(context);
    var code = 'kwargs.baz = \'bax\'; isObj = kwargs instanceof Object';
    vm.runInContext(code, context);
    var isObj = autobahn.util.is_object(context.kwargs);
    test.log(isObj);
    var chk = test.check();
    testcase.ok(!chk, chk);
    testcase.done();
};
