all:
	@echo "Targets:"
	@echo ""
	@echo "   clean            Clean everything"
	@echo "   build            Build AutobahnJS library"
	@echo "   publish          Clean, build and publish to S3"
	@echo ""

clean:
	scons -uc
	rm -rf ./build

build:
	mkdir -p build
	browserify package/lib/autobahn.js --standalone autobahn -o build/autobahn.js
	scons

publish: clean build
	scons publish
