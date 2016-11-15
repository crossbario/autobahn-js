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
	rm -rf ./node_modules
	rm -f .sconsign.dblite

build_browser:
	scons

build_npm:
	@echo "Ok, nothing to build for npm!"

publish_browser:
	scons publish
	cp ./build/* ../autobahn-js-built
	@echo "Now commit and push autobahn-js-built!"

publish_npm:
	npm publish

test:
	npm test

test_connect:
	nodeunit test/test_connect.js

test_msgpack_serialization:
	nodeunit test/test_msgpack_serialization.js
