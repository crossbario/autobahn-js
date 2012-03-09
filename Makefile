UPLOADLOCATION = "www.tavendo.de:~/static/autobahnjs"

SRC_DIR = src
TEST_DIR = test
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist

JS_ENGINE ?= `which node nodejs 2>/dev/null`
COMPILER = ${JS_ENGINE} ${BUILD_DIR}/uglify.js --unsafe
POST_COMPILER = ${JS_ENGINE} ${BUILD_DIR}/post-compile.js

MODULES = ${SRC_DIR}/autobahn.js

AB = ${DIST_DIR}/autobahn.js
AB_MIN = ${DIST_DIR}/autobahn.min.js

AB_VER = $(shell cat version.txt)
VER = sed "s/@VERSION/${AB_VER}/"

DATE=$(shell git log -1 --pretty=format:%ad)

all: core

publish: autobahn min
	@@echo "Uploading AutobahnJS .."
	scp ${AB} ${AB_MIN} ${UPLOADLOCATION}

core: autobahn min hint
	@@echo "AutobahnJS build complete."

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

autobahn: ${AB}

${AB}: ${MODULES} | ${DIST_DIR}
	@@echo "Building" ${AB}

	@@cat ${MODULES} | \
		sed 's/.function..AutobahnJS...{//' | \
		sed 's/}...AutobahnJS..;//' | \
		sed 's/@DATE/'"${DATE}"'/' | \
		${VER} > ${AB};

hint: autobahn
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Checking AutobahnJS against JSHint..."; \
		${JS_ENGINE} build/jshint-check.js; \
	else \
		echo "You must have NodeJS installed in order to test AutobahnJS against JSHint."; \
	fi

min: autobahn ${AB_MIN}

${AB_MIN}: ${AB}
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Minifying AutobahnJS" ${AB_MIN}; \
		${COMPILER} ${AB} > ${AB_MIN}.tmp; \
		${POST_COMPILER} ${AB_MIN}.tmp; \
		rm -f ${AB_MIN}.tmp; \
	else \
		echo "You must have NodeJS installed in order to minify AutobahnJS."; \
	fi

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}

.PHONY: all autobahn hint min clean
