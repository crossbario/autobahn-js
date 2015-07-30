##   http://dontkry.com/posts/code/browserify-and-the-universal-module-definition.html
##   http://addyosmani.com/writing-modular-js/

##
## ~/.npmrc
## npm config edit
## npm adduser
##

all: bundle

clean:
	rm -rf ./build

bundle:
	mkdir -p ./build
	browserify lib/autobahn.js --standalone autobahn -o build/autobahn.js

test:
	npm test

test_connect:
	nodeunit test/test_connect.js 

install:
	npm install ws
	npm install when
	npm install crypto-js
	npm install browserify

publish:
	npm publish
