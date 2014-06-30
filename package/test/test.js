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

// this works via https://github.com/caolan/nodeunit

var rpc_complex = require('./test_rpc_complex.js');
var rpc_arguments = require('./test_rpc_arguments.js');
var rpc_error = require('./test_rpc_error.js');
var rpc_options = require('./test_rpc_options.js');
var rpc_progress = require('./test_rpc_progress.js');
var rpc_slowsquare = require('./test_rpc_slowsquare.js');
var rpc_routing = require('./test_rpc_routing.js');
var pubsub_basic = require('./test_pubsub_basic.js');
var pubsub_complex = require('./test_pubsub_complex.js');
var pubsub_options = require('./test_pubsub_options.js');

exports.testRpcArguments = rpc_arguments.testRpcArguments;
exports.testRpcComplex = rpc_complex.testRpcComplex;
exports.testRpcError = rpc_error.testRpcError;
exports.testRpcOptions = rpc_options.testRpcOptions;
exports.testRpcProgress = rpc_progress.testRpcProgress;
exports.testRpcSlowsquare = rpc_slowsquare.testRpcSlowsquare;
exports.testRpcRouting = rpc_routing.testRpcRouting;
exports.testPubsubBasic = pubsub_basic.testPubsubBasic;
exports.testPubsubComplex = pubsub_complex.testPubsubComplex;
exports.testPubsubOptions = pubsub_options.testPubsubOptions;


//var connect = require('./test_connect.js');
//exports.testConnect = connect.testConnect;
