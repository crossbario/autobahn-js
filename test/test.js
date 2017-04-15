///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (c) Crossbar.io Technologies GmbH and contributors
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

// this works via https://github.com/caolan/nodeunit

var sync = require('./test_basic_sync.js');
var async = require('./test_basic_async.js');

var connect = require('./test_connect.js');

var serialization_json = require('./test_serialization_json.js');
var serialization_msgpack = require('./test_serialization_msgpack.js');
var serialization_cbor = require('./test_serialization_cbor.js');

var rawsocket_transport = require('./test_rawsocket_transport.js');

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
var pubsub_excludme = require('./test_pubsub_excludeme.js');
var pubsub_exclude = require('./test_pubsub_exclude.js');
var pubsub_eligible = require('./test_pubsub_eligible.js');
var pubsub_prefix_sub = require('./test_pubsub_prefix_sub.js');
var pubsub_wildcard_sub = require('./test_pubsub_wildcard_sub.js');
var pubsub_multiple_matching_subs = require('./test_pubsub_multiple_matching_subs.js');

exports.testSync = sync.testSync;
exports.testAsync = async.testAsync;

exports.testConnect = connect.testConnect;

exports.testJSONSerialization = serialization_json.testJSONSerialization;
exports.testMsgpackSerialization = serialization_msgpack.testMsgpackSerialization;
exports.testCBORSerialization = serialization_cbor.testCBORSerialization;

exports.testRawSocketTransport = rawsocket_transport.testRawSocketTransport;

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
exports.testPubsubExcludeMe = pubsub_excludme.testPubsubExcludeMe;
exports.testPubsubExclude = pubsub_exclude.testPubsubExclude;
exports.testPubsubEligible = pubsub_eligible.testPubsubEligible;
exports.testPubsubPrefixSub = pubsub_prefix_sub.testPubsubPrefixSub;
exports.testPubsubWildcardSub = pubsub_wildcard_sub.testPubsubWildcardSub;
exports.testPubsubMultipleMatchingSubs = pubsub_multiple_matching_subs.testPubsubMultipleMatchingSubs;
