.PHONY: clean build publish

default:
	@echo "Targets: clean, build, publish"

clean:
	rm -rf build

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

