.PHONY: test

default:
	@echo "Targets: test, clean, dependencies, publish"

test:
	npm test

test_connect:
	nodeunit test/test_connect.js

test_msgpack_serialization:
	nodeunit test/test_msgpack_serialization.js

clean:
	rm -rf ./node_modules

dependencies:
	npm update

publish:
	npm publish
