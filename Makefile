.PHONY: clean build publish test

default:
	@echo "Targets: clean, build, publish"

clean:
	rm -rf build
	rm -rf ./node_modules
	rm -f .sconsign.dblite

build:
	scons

publish:
	scons publish
	cp ./build/* ../autobahn-js-built
	@echo "Now commit and push autobahn-js-built!"

closure_version:
	java -jar ${JS_COMPILER} --version

requirements:
	pip install -U scons scour taschenmesser boto


test:
	npm test

test_connect:
	nodeunit test/test_connect.js

test_msgpack_serialization:
	nodeunit test/test_msgpack_serialization.js

dependencies:
	npm update

publish_npm:
	npm publish
