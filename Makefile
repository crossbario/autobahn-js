.PHONY: clean test build_browser build_npm publish_browser publish_npm

default:
	@echo "Targets:"
	@echo "  - clean            Clean the build"
	@echo "  - test             Run all unit tests"
	@echo "  - build_browser    Build browser version of the library"
	@echo "  - build_npm        NOOP (there is nothing to prebuild here)"
	@echo "  - publish_browser  Publish the browser version of the library"
	@echo "  - publish_npm      Publish the npm version of the library"

clean:
	rm -rf build

dist_clean: clean
	rm -rf ./node_modules
	rm -f .sconsign.dblite

requirements:
	pip install -U scons boto taschenmesser
	sudo apt update
	sudo apt install -y npm nodejs-legacy default-jre
	node -v
	sudo npm install -g google-closure-compiler nodeunit

browser_deps:
	npm install
	npm update


build: build_browser build_npm

build_browser:
	scons

build_npm:
	@echo "Ok, npm doesn't need a build step"


publish: publish_browser publish_npm

publish_browser: build_browser
	git -C ../autobahn-js-built pull
	cp ./build/* ../autobahn-js-built/
	cp ./build/* ../crossbar-examples/_shared-web-resources/autobahn/
	cp ./build/* ../crossbar/crossbar/templates/default/web/js/
	@echo "Now commit and push these repos: autobahn-js-built, crossbar"

publish_npm: build_npm
	npm publish


crossbar:
	crossbar start

test:
	npm test

test_connect:
	nodeunit test/test_connect.js

test_serialization_cbor:
	nodeunit test/test_serialization_cbor.js

test_pubsub_multiple_matching_subs:
	nodeunit test/test_pubsub_multiple_matching_subs.js
