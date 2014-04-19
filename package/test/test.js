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

exports.testRpcArguments = rpc_arguments.testRpcArguments;
exports.testRpcComplex = rpc_complex.testRpcComplex;
exports.testRpcError = rpc_error.testRpcError;
exports.testRpcOptions = rpc_options.testRpcOptions;
