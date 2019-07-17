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
	-sudo rm -f .sconsign.dblite
	-sudo rm -rf ./build
	-sudo rm -rf ./packages/autobahn/build


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
# host native build targets
#
requirements:
	pip install -U scons boto taschenmesser
	sudo apt update
	sudo apt install -y npm nodejs default-jre
	node -v

build_browser_docker:
	cd packages/autobahn; npm install --only=dev
	cd packages/autobahn; npm install
	cd packages/autobahn; scons

build_browser_host:
	cd packages/autobahn; npm install --only=dev
	cd packages/autobahn; npm install
	cd packages/autobahn; JAVA_HOME=/usr/lib/jvm/default-java JS_COMPILER=${PWD}/packages/autobahn/node_modules/google-closure-compiler-java/compiler.jar scons

build_build_npm:
	@echo "Ok, npm doesn't need a build step"


#
# Package publication targets
#
publish: publish_browser publish_npm

publish_browser:
	git -C ../autobahn-js-browser pull
	cp ./packages/autobahn/build/* ../autobahn-js-browser/
	cp ./packages/autobahn/build/* ../crossbar-examples/_shared-web-resources/autobahn/
	cp ./packages/autobahn/build/* ../crossbarfx/test/_shared_web/autobahn/
	@echo "Now commit and push these repos: autobahn-js-browser, crossbar-examples"

publish_npm: build_npm
	cd packages/autobahn; npm publish


#
# Test targets
#
crossbar:
	crossbar start

crossbar_docker:
	docker run -it --rm -v ${PWD}/.crossbar:/node -p 8080:8080 -p 8090:8090 -u 1000 crossbario/crossbar --cbdir /node

test:
	npm test
	npm list ws bufferutil when crypto-js

test_connect:
	nodeunit test/test_connect.js

test_serialization_cbor:
	nodeunit test/test_serialization_cbor.js

test_pubsub_multiple_matching_subs:
	nodeunit test/test_pubsub_multiple_matching_subs.js

test_binary:
	nodeunit test/test_binary.js -t testBinaryCBOR

	# bigint not implemented
	# nodeunit test/test_binary.js -t testBinaryMsgPack

	# binary not implemented
	# nodeunit test/test_binary.js -t testBinaryJSON
