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


function rand_normal(mean, sd) {
   // Derive a Gaussian from Uniform random variables
   // http://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
   var x1, x2, rad;
 
   do {
      x1 = 2 * Math.random() - 1;
      x2 = 2 * Math.random() - 1;
      rad = x1 * x1 + x2 * x2;
   } while (rad >= 1 || rad == 0);
 
   var c = Math.sqrt(-2 * Math.log(rad) / rad);
 
   return (mean || 0) + (x1 * c) * (sd || 1);
};

var assert	= function(cond, text){
	if( cond )	return;
	if( assert.useDebugger || AUTOBAHN_DEBUG)	debugger;
	throw new Error(text || "Assertion failed!");
};


function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};

function deepCopy(p,c) {
    var i;
var c = c||{};
for (i in p) {
  if (typeof p[i] === 'object' && p[i]!==null && p[i]!==undefined) {
    c[i] = (p[i].constructor === Array)?[]:{};
    deepCopy(p[i],c[i]);
  } else c[i] = p[i];}
return c;
}

function merge_options(default_options, options) {
    var opts = deepCopy(default_options);
    for(var option in options) {
        if(typeof options[option] === "object" && options[option]!==null && options[option]!==undefined) {
            if(options[option].constructor === Array) {
                opts[option] = options[option];
            } else {
                opts[option] = merge_options(opts[option], options[option]);
            }
        } else {
            opts[option] = options[option];
        }
    }
    return opts;
};

exports.rand_normal = rand_normal;
exports.assert = assert;
exports.merge_options = merge_options;
exports.parseUri = parseUri;
exports.deepCopy = deepCopy;