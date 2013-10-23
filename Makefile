all: clean build

clean:
	scons -uc
	rm -rf ./build

build:
	scons
