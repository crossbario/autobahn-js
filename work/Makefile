all: bundle1 bundle2

bundle1:
	browserify test1.js -o bundle1.js

bundle2:
	browserify test2.js -o bundle2.js
#	browserify test1.js --standalone ab -o bundle.js

test1:
	node node_test1.js

test2:
	node node_test2.js

install:
	npm install websocket
	npm install ws
	npm install when
