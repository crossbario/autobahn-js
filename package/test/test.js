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
var rpc_arguments = require('./test_arguments.js');
var rpc_error = require('./test_rpc_error.js');

exports.testArguments = rpc_arguments.testArguments;
exports.testComplex = rpc_complex.testComplex;
exports.testRpcError = rpc_error.testRpcError;
