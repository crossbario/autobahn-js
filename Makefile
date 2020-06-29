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
# Cleanup targets (we use "sudo" to cleanup when building not on host, but via target "docker_build_browser")
#
distclean: clean
	-sudo rm -rf ./node_modules
	-sudo rm -rf ./packages/autobahn/node_modules
	-sudo rm -f ./package-lock.json
	-sudo rm -f ./packages/autobahn/package-lock.json

clean:
	-rm -f .sconsign.dblite
	-rm -rf ./build
	-rm -rf ./packages/autobahn/build
	-rm -rf ./packages/autobahn-xbr/build


abi_files:
	curl -s https://xbr.network/lib/abi/xbr-protocol-latest.zip -o /tmp/xbr-protocol-latest.zip
	unzip -t /tmp/xbr-protocol-latest.zip
	rm -rf ${PWD}/packages/autobahn-xbr/lib/contracts/
	unzip /tmp/xbr-protocol-latest.zip -d ${PWD}/packages/autobahn-xbr/lib/contracts/

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
		make build_browser_docker


#
# Build js packages for autobahn and autobahn-xbr
#
requirements:
	pip install -U scons boto taschenmesser
	-rm -rf ./node_modules/websocket
	npm install browserify
	sudo apt update
	sudo apt install -y npm nodejs default-jre
	node -v

contracts:
	rm -f /tmp/xbr-protocol-latest.zip
	curl -s https://xbr.network/lib/abi/xbr-protocol-latest.zip -o /tmp/xbr-protocol-latest.zip
	rm -rf packages/autobahn-xbr/contracts
	mkdir packages/autobahn-xbr/contracts
	unzip /tmp/xbr-protocol-latest.zip -d packages/autobahn-xbr/contracts

build: build_browser build_npm

build_browser: contracts build_browser_ab build_browser_xbr

build_browser_ab:
	-rm -rf ./packages/autobahn/node_modules/websocket
	-rm -f ./packages/autobahn/build/*
	npm install --only=dev --prefix ./packages/autobahn
	npm install --prefix ./packages/autobahn
	JAVA_HOME=/usr/lib/jvm/default-java JS_COMPILER=${PWD}/packages/autobahn/node_modules/google-closure-compiler-java/compiler.jar scons -C ./packages/autobahn
	ls -la packages/autobahn/build/
	mkdir -p ../../xbr/xbr-www/backend/xbrnetwork/static/autobahn/
	cp ./packages/autobahn/build/autobahn.js ../../xbr/xbr-www/backend/xbrnetwork/static/autobahn/

build_browser_xbr:
	-rm -rf ./packages/autobahn-xbr/node_modules/websocket
	-rm -f ./packages/autobahn-xbr/build/*
	npm install --only=dev --prefix ./packages/autobahn-xbr
	npm install --prefix ./packages/autobahn-xbr
	JAVA_HOME=/usr/lib/jvm/default-java JS_COMPILER=${PWD}/packages/autobahn/node_modules/google-closure-compiler-java/compiler.jar scons -C ./packages/autobahn-xbr
	ls -la packages/autobahn-xbr/build/
	mkdir -p ../../xbr/xbr-www/backend/xbrnetwork/static/autobahn-xbr/
	cp ./packages/autobahn-xbr/build/autobahn-xbr.js ../../xbr/xbr-www/backend/xbrnetwork/static/autobahn-xbr/

build_npm:
	@echo "Ok, npm doesn't need a build step"


#
# Package publication targets
#
publish: publish_browser publish_npm

publish_browser:
	git -C ../autobahn-js-browser pull
	cp ./packages/autobahn-xbr/build/* ../autobahn-js-browser/autobahn-xbr
	cp ./packages/autobahn/build/* ../autobahn-js-browser/autobahn
	# cp ./packages/autobahn/build/* ../crossbar-examples/_shared-web-resources/autobahn/
	# cp ./packages/autobahn/build/* ../crossbarfx/test/_shared_web/autobahn/
	@echo "Now commit and push these repos: autobahn-js-browser, crossbar-examples"

publish_npm: contracts build_npm
	cd packages/autobahn; npm publish
	cd packages/autobahn-xbr; npm publish


#
# Test targets
#
crossbar:
	crossbar start

crossbar_docker:
	docker run -it --rm -v ${PWD}/.crossbar:/node -p 8080:8080 -p 8090:8090 -u 1000 crossbario/crossbar --cbdir /node

test:
	# npm install
	cd packages/autobahn && npm test
	# FIXME: add xbr specific unit tests
	# cd packages/autobahn-xbr && npm test

test_connect:
	cd packages/autobahn && nodeunit test/test_connect.js

test_serialization_cbor:
	cd packages/autobahn && nodeunit test/test_serialization_cbor.js

test_pubsub_multiple_matching_subs:
	cd packages/autobahn && nodeunit test/test_pubsub_multiple_matching_subs.js

test_binary:
	cd packages/autobahn && nodeunit test/test_binary.js -t testBinaryCBOR
