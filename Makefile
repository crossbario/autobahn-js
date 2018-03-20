.PHONY: clean test build_browser build_npm publish_browser publish_npm

default:
	@echo "Targets:"
	@echo "  - clean            Clean the build"
	@echo "  - test             Run all unit tests"
	@echo "  - build_browser    Build browser version of the library"
	@echo "  - build_npm        NOOP (there is nothing to prebuild here)"
	@echo "  - publish_browser  Publish the browser version of the library"
	@echo "  - publish_npm      Publish the npm version of the library"


#
# Cleanup targets
#
clean:
	sudo rm -rf build

dist_clean: clean
	sudo rm -rf ./node_modules
	sudo rm -f .sconsign.dblite


#
# Docker based build targets (normally, use these!)
#

# build Docker toolchain image
docker_build_toolchain:
	docker build \
		-t autobahnjs-toolchain \
		-f Dockerfile \
		.

docker_toolchain_shell:
	docker run -it --rm \
		--net=host \
		-v ${PWD}:/work \
		autobahnjs-toolchain \
		bash

# use the Docker toolchain image to build AutobahnJS
# for browsers
docker_build_browser:
	docker run -it --rm \
		--net=host \
		-v ${PWD}:/work \
		autobahnjs-toolchain \
		make browser_deps build_browser


#
# host native build targets
#
requirements:
	pip install -U scons boto taschenmesser
	sudo apt update
	sudo apt install -y npm nodejs-legacy default-jre
	node -v
	sudo npm install -g google-closure-compiler nodeunit

browser_deps:
	npm install
	npm update

build_browser:
	scons
	java -jar /usr/local/lib/node_modules/google-closure-compiler/compiler.jar --version

build_npm:
	@echo "Ok, npm doesn't need a build step"


#
# Package publication targets
#
publish: publish_browser publish_npm

publish_browser:
	git -C ../autobahn-js-browser pull
	cp ./build/* ../autobahn-js-browser/
	cp ./build/* ../crossbar-examples/_shared-web-resources/autobahn/
	cp ./build/* ../crossbar/crossbar/templates/default/web/js/
	@echo "Now commit and push these repos: autobahn-js-browser, crossbar"

publish_npm: build_npm
	npm publish


#
# Test targets
#
crossbar:
	crossbar start

test:
	npm test
	npm list ws bufferutil when crypto-js

test_connect:
	nodeunit test/test_connect.js

test_serialization_cbor:
	nodeunit test/test_serialization_cbor.js

test_pubsub_multiple_matching_subs:
	nodeunit test/test_pubsub_multiple_matching_subs.js
