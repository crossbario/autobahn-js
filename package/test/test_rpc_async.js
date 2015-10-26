///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (C) 2011-2014 Tavendo GmbH, http://tavendo.com
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var autobahn = require('./../index.js');
var testutil = require('./testutil.js');


exports.testRpcAsync = function (testcase) {
    testcase.expect(1);
    var test = new testutil.Testlog("test/test_rpc_async.txt");
    var connection = new autobahn.Connection(testutil.config);

    function stars(args, kwargs) {
        test.log('stars', args, kwargs);
        kwargs = kwargs || {};
        kwargs.nick = kwargs.nick || "somebody";
        kwargs.stars = kwargs.stars || 0;
        return kwargs.nick + " starred " + kwargs.stars + "x";
    }

    connection.onopen = function (session) {
        test.log('Connected');

        session.register('com.async.call', function(args, kwars, cd, done) {
            setTimeout(function() {
                done(null, stars(args, kwars));
            }, 100);
        }, {
            async: true
        });

        session.register('com.async.callbad', function(args, kwars, cd, done) {
            setTimeout(function() {
                done('Bad call!!!');
            }, 100);
        }, {
            async: true
        });

        session.call('com.async.call', [], {nick: 'Homer', stars: 5}).then(function (res) {
            test.log(res);
            session.call('com.async.callbad', [], {stars: 2}).then(function(res) {
                test.log('This call should not pass.');
            }, function(err) {
                test.log(err.args[0]);
                test.log("All finished.");
                connection.close();
                var chk = test.check();
                testcase.ok(!chk, chk);
                testcase.done();
            });
        }, function(err) {
            test.log(err);
        });
    };
    connection.open();
};
