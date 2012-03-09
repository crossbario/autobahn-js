#!/usr/bin/env node

var fs = require( "fs" ),
   src = fs.readFileSync( process.argv[2], "utf8" ),
   version = fs.readFileSync( "version.txt", "utf8" ),
   // License Template
   license = "/*! AutobahnJS v@VERSION http://autobahn.ws | Copyright Tavendo GmbH. Licensed under the Apache 2.0 License http://www.apache.org/licenses/LICENSE-2.0 */";

// Previously done in sed but reimplemented here due to portability issues
src = src.replace( /^(\s*\*\/)(.+)/m, "$1\n$2" ) + ";";

// Set minimal license block var
license = license.replace( "@VERSION", version );

// Replace license block with minimal license
src = src.replace( /\/\/.*?\/?\*.+?(?=\n|\r|$)|\/\*[\s\S]*?\/\/[\s\S]*?\*\//, license );

fs.writeFileSync( "dist/autobahn.min.js", src, "utf8" );
