##   http://dontkry.com/posts/code/browserify-and-the-universal-module-definition.html
##   http://addyosmani.com/writing-modular-js/

all: bundle

bundle:
	browserify lib/autobahn.js --standalone autobahn -o build/autobahn.js

test:
	npm test

install:
	npm install ws
	npm install when
	npm install crypto-js
	npm install browserify
