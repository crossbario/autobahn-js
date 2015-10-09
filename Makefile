all:
	scons

bundle:
	browserify package/lib/autobahn.js --standalone autobahn -o build/autobahn.js

clean:
	rm -rf build

closure_version:
	java -jar ${JS_COMPILER} --version
