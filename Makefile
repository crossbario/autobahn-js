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
	scons

publish: clean build
	scons publish
