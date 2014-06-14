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
var util = require('./util.js');

function Transports() {
    this._repository = {};
}

Transports.prototype.register = function() {
    var factory;
    var name;

    util.assert(arguments.length>0, "Need to provide at least 1 argument autobahn.transports.register(TransportFactory)");
    util.assert(arguments.length<3, "Need to provide at max 2 arguments autobahn.transports.register(alias, TransportFactory)");

    if(arguments.length==1) {
        factory = arguments[0];
        util.assert(typeof factory.type === "string", "Transport does not provide a .name attribute");
        name = factory.type;
    } else {
        name = arguments[0];
        factory = arguments[1];
        util.assert(typeof factory.type === "string", "Factory does not provide a .name attribute");
    }
    util.assert(typeof factory.prototype.create === "function", "Protocol '" + name + "' does not provide a .create method");
    this._repository[name] = factory;
};
Transports.prototype.isRegistered = function(name) {
    return this._repository[name] ? true: false;
};
Transports.prototype.get = function(name) {
    var mod;
    if (this._repository[name] !== undefined) {
        mod = this._repository[name];
    } else {

      util.assert(false, "No such transport: " + name);

    }
    return mod;
}
Transports.prototype.list = function() {
    var items = [];
    for(var name in this._repository) {
        items.push(name);
    }
    return items;
};



var _transports = new Transports();




/**
 * Register defaults
 */
var websocket = require('./transport/websocket.js');
_transports.register("websocket", websocket.Factory);

exports.transports = _transports;