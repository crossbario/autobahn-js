/**
 * End to end test cases to test the on_user_error_handler feature, when an error is occurred in a user defined
 * handlers (onopen, onclose, oninvoke, onevent).
 */

var autobahn = require('./../index.js');
var testutil = require('./testutil.js');

// It should call the on_user_error handler, when an exception is thrown in the onopen callback.
exports.errorHandlingOnOpen = function (testcase) {

    // Prepare the test case
    testcase.expect(3);
    var timeout = testutil.create_timeout_handler(testcase);
    var test = new testutil.Testlog("test/test_error_handling_on_open.txt");
    var config = Object.assign({}, testutil.config);
    var expectedErrorMessage = "On open user error.";
    var expectedCustomMessage = "Exception raised from app code while firing Connection.onopen()";

    // Define the tested feature's on user error handler. The test case ends here.
    config.on_user_error = function (error, customMessage) {

        test.log("Step 4: The user error handler is called");
        testcase.deepEqual(error.message, expectedErrorMessage);
        testcase.deepEqual(customMessage, expectedCustomMessage);

        test.log("Step 5: Finish the test case");
        var check = test.check();
        testcase.ok(!check, check);
        timeout.clear();
        testcase.done();
    };

    var connection = new autobahn.Connection(config);
    connection.onopen = function (session) {
        test.log("Step 2: The onopen handler is called.");
        test.log("Step 3: A user error is occurred in the handler.");
        throw Error(expectedErrorMessage);
    };

    connection.onclose = function(reason) {
        testcase.ok(false, "Error: Connection closed, it shouldn\'t be opened. Close reason:", reason);
    };

    // Execute the test case
    test.log("Step 1: open a connection.");
    timeout.set();
    connection.open();
};

// It should call the on_user_error handler, when an exception is thrown in the onclose callback.
exports.errorHandlingOnClose = function (testcase) {

    // Prepare the test case

    testcase.expect(3);
    var timeout = testutil.create_timeout_handler(testcase);
    var test = new testutil.Testlog("test/test_error_handling_on_colse.txt");
    var config = Object.assign({}, testutil.config);
    var expectedErrorMessage = "On close user error.";
    var expectedCustomMessage = "Exception raised from app code while firing Connection.onclose()";

    // Define the tested feature's on user error handler. The test case ends here.
    config.on_user_error = function (error, customMessage) {
        test.log("Step 6: The error handler is called.")
        testcase.deepEqual(error.message, expectedErrorMessage);
        testcase.deepEqual(customMessage, expectedCustomMessage);

        test.log("Step 7: finishing the test case.")
        var check = test.check();
        testcase.ok(!check, check);
        timeout.clear();
        testcase.done();
    };

    var connection = new autobahn.Connection(config);

    connection.onopen = function (session) {
        test.log("Step 2: the onopen handler is called.")
        test.log("Step 3: close the connection.")
        connection.close();
    };

    connection.onclose = function(reason) {
        test.log("Step 4: the onclose handler is called")
        test.log("Step 5: the handler has a user error")
        throw Error(expectedErrorMessage);
    };

    // Execute the test case:

    test.log("Step 1: open a connection")
    timeout.set();
    connection.open();
};

// It should call the on_user_error handler in the Subscriber, when an exception is thrown in the event handler in a case of a subscription.
exports.errorHandlingOnEvent = function(testcase) {

    // Prepare the test case

    testcase.expect(3);
    var timeout = testutil.create_timeout_handler(testcase);
    var test = new testutil.Testlog("test/test_error_handling_on_event.txt");
    var config = Object.assign({}, testutil.config);
    var expectedErrorMessage = "Event handler user error.";
    var expectedCustomMessage = "Exception raised in event handler:";

    // Define the tested feature's on user error handler. The test case ends here.
    config.on_user_error = function (error, customMessage) {

        test.log("Step 6: the on user error is called")
        testcase.deepEqual(error.message, expectedErrorMessage);
        testcase.deepEqual(customMessage, expectedCustomMessage);

        test.log("Step 7: finishing the test cases");
        var check = test.check();
        testcase.ok(!check, check);
        timeout.clear();
        testcase.done();
    };

    // Execute the test case

    test.log("Step 1: make two connections")
    timeout.set();
    autobahn.when.all(testutil.connect_n(2, config)).then(function(sessions) {
        var subscriber = sessions[0];
        var publisher = sessions[1];

        test.log("Step 2: subscribe to a topic")
        subscriber.subscribe("com.myapp.topic", function() {
            test.log("Step 4: the event handler is called");

            test.log("Step 5: an error thrown in the event handler");
            throw Error(expectedErrorMessage);
        });

        setTimeout(function () {
            test.log("step 3: publish to a topic")
            publisher.publish("com.myapp.topic", []);
        }, 100);

    }, function(error) {
        testcase.ok(false, "Error occurred during the connection: " + error);
        testcase.done();
    });
};

// It should call the on_user_error handler, when an exception is thrown in the INVOCATION callback at the callee side,
// when a remote procedure call is invoked. The wamp runtime error should be received on the caller side.
exports.errorHandlingOnInvocation = function(testcase) {

    // Prepare the test case

    testcase.expect(3);
    var timeout = testutil.create_timeout_handler(testcase);
    var test = new testutil.Testlog("test/test_error_handling_on_invocation.txt");
    var config = Object.assign({}, testutil.config);
    var expectedErrorMessage = "Invocation handler user error.";
    var expectedCustomMessage = "Exception raised in invocation handler:";

    // Define the tested feature's on user error handler. The test case ends here.
    config.on_user_error = function (error, customMessage) {

        test.log("Step 7: The error handler is called");
        testcase.deepEqual(error.message, expectedErrorMessage);
        testcase.deepEqual(customMessage, expectedCustomMessage);
    };

    // Execute the test case

    test.log("Step 1: Create two sessions.")
    timeout.set();
    autobahn.when.all(testutil.connect_n(2, config)).then(function(sessions) {
        var callee = sessions[0];
        var caller = sessions[1];

        test.log("Step 2: Register an invocation handler in the callee role.")
        callee.register("com.myapp.topic", function() {
            test.log("Step 4: The invocation handler is called.")
            test.log("Step 5: An is error occurred in the handler.")
            throw Error(expectedErrorMessage);
        });

        setTimeout(function () {

            test.log("Step 3: Call the topic in the caller role.");
            caller.call("com.myapp.topic", []).then(function (result) {
                testcase.ok(false, "The result of the call should not be successful.");
            }, function (error) {
                test.log("Step 8: The error is received on the callee side.")
                test.log("Step 9: Finish the  test case.")
                var check = test.check();
                testcase.ok(!check, check);
                timeout.clear();
                testcase.done();
            });
        }, 100);

    }, function(error) {
        testcase.ok(false, "Error occurred during the connection:" + error);
    });
};