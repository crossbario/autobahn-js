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
	-sudo rm -rf ./packages/autobahn-xbr/node_modules
	-sudo rm -f ./package-lock.json
	-sudo rm -f ./packages/autobahn/package-lock.json
	-sudo rm -f ./packages/autobahn-xbr/package-lock.json

clean:
	-rm -f .sconsign.dblite
	-rm -rf ./build
	-rm -rf ./packages/autobahn/build
	-rm -rf ./packages/autobahn-xbr/build
	-rm -rf ./packages/autobahn-xbr/lib/contracts


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
	rm -rf ./node_modules/websocket
	npm install browserify
	sudo apt update
	sudo apt install -y npm nodejs default-jre
	node -v

build: build_browser build_npm

build_browser: abi_files build_browser_ab build_browser_xbr

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

publish_npm: abi_files build_npm
	cd packages/autobahn; npm publish
	cd packages/autobahn-xbr; npm publish


#
# Test targets
#
crossbar:
	crossbar start

crossbar_docker:
	docker run -it --rm -v ${PWD}/.crossbar:/node -p 8080:8080 -p 8090:8090 -u 1000 crossbario/crossbar --cbdir /node

#test_binary:
#	cd packages/autobahn && nodeunit test/test_binary.js -t testBinaryCBOR

test_clean:
	-rm packages/autobahn/test/test*.txt
	-rm packages/autobahn/test/test*.json

test_basic_async:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_basic_async.json nodeunit test/test_basic_async.js

test_basic_sync:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_basic_sync.json nodeunit test/test_basic_sync.js

test_binary:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_binary.json nodeunit test/test_binary.js

test_connect:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_connect.json nodeunit test/test_connect.js

test_error_handling:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_error_handling.json nodeunit test/test_error_handling.js

test_pubsub_basic:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_pubsub_basic.json nodeunit test/test_pubsub_basic.js

test_pubsub_complex:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_pubsub_complex.json nodeunit test/test_pubsub_complex.js

test_pubsub_eligible:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_pubsub_eligible.json nodeunit test/test_pubsub_eligible.js

test_pubsub_exclude:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_pubsub_exclude.json nodeunit test/test_pubsub_exclude.js

test_pubsub_excludeme:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_pubsub_excludeme.json nodeunit test/test_pubsub_excludeme.js

test_pubsub_multiple_matching_subs:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_pubsub_multiple_matching_subs.json nodeunit test/test_pubsub_multiple_matching_subs.js

test_pubsub_options:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_pubsub_options.json nodeunit test/test_pubsub_options.js

test_pubsub_prefix_sub:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_pubsub_prefix_sub.json nodeunit test/test_pubsub_prefix_sub.js

test_pubsub_wildcard_sub:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_pubsub_wildcard_sub.json nodeunit test/test_pubsub_wildcard_sub.js

test_rawsocket_protocol:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_rawsocket_protocol.json nodeunit test/test_rawsocket_protocol.js

test_rawsocket_transport:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_rawsocket_transport.json nodeunit test/test_rawsocket_transport.js

test_rpc_arguments:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_rpc_arguments.json nodeunit test/test_rpc_arguments.js

test_rpc_complex:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_rpc_complex.json nodeunit test/test_rpc_complex.js

test_rpc_error:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_rpc_error.json nodeunit test/test_rpc_error.js

test_rpc_options:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_rpc_options.json nodeunit test/test_rpc_options.js

test_rpc_progress:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_rpc_progress.json nodeunit test/test_rpc_progress.js

test_rpc_request_id_sequence:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_rpc_request_id_sequence.json nodeunit test/test_rpc_request_id_sequence.js

test_rpc_routing:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_rpc_routing.json nodeunit test/test_rpc_routing.js

test_rpc_slowsquare:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_rpc_slowsquare.json nodeunit test/test_rpc_slowsquare.js

test_sealedbox:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_sealedbox.json nodeunit test/test_sealedbox.js

test_serialization_cbor:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_serialization_cbor.json nodeunit test/test_serialization_cbor.js

test_serialization_json:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_serialization_json.json nodeunit test/test_serialization_json.js

test_serialization_msgpack:
	cd packages/autobahn && AUTOBAHN_TRACE=test/test_serialization_json.json nodeunit test/test_serialization_msgpack.js


# FIXME!
# test: test_binary test_sealedbox

test: test_basic_async test_basic_sync test_connect test_error_handling test_pubsub_basic test_pubsub_complex test_pubsub_eligible test_pubsub_exclude test_pubsub_excludeme test_pubsub_options test_pubsub_prefix_sub test_pubsub_wildcard_sub test_rawsocket_protocol test_rawsocket_transport test_rpc_arguments test_rpc_complex test_rpc_error test_rpc_options test_rpc_progress test_rpc_request_id_sequence test_rpc_routing test_rpc_slowsquare test_serialization_cbor test_serialization_json test_serialization_msgpack
