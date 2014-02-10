##   http://dontkry.com/posts/code/browserify-and-the-universal-module-definition.html
##   http://addyosmani.com/writing-modular-js/

all: bundle

bundle:
	browserify autobahn.js --standalone autobahn -o autobahn.bundle.js

test:
	node timeservice.js

install:
	npm install websocket
	npm install ws
	npm install when
	npm install browserify
