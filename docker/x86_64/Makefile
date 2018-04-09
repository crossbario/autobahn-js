.PHONY: build

HOSTIP=$(shell ip route get 1 | awk '{print $$NF;exit}')

default:
	@echo "Targets: build, test, publish, .."


build: build_full build_alpine

build_full:
	time docker build \
		--build-arg BUILD_DATE=${BUILD_DATE} \
		--build-arg AUTOBAHN_JS_VCS_REF=${AUTOBAHN_JS_VCS_REF} \
		--build-arg AUTOBAHN_JS_VERSION=${AUTOBAHN_JS_VERSION} \
		-t crossbario/autobahn-js:full \
		-t crossbario/autobahn-js:full-${AUTOBAHN_JS_VERSION} \
		-f Dockerfile.full .

build_alpine:
	time docker build \
		--build-arg BUILD_DATE=${BUILD_DATE} \
		--build-arg AUTOBAHN_JS_VCS_REF=${AUTOBAHN_JS_VCS_REF} \
		--build-arg AUTOBAHN_JS_VERSION=${AUTOBAHN_JS_VERSION} \
		-t crossbario/autobahn-js \
		-t crossbario/autobahn-js:alpine \
		-t crossbario/autobahn-js:alpine-${AUTOBAHN_JS_VERSION} \
		-f Dockerfile.alpine .


version: os_version node_version autobahn_version

os_version:
	docker run -it --rm crossbario/autobahn-js:full uname -a
	docker run -it --rm crossbario/autobahn-js:alpine uname -a

node_version:
	docker run -it --rm crossbario/autobahn-js:full node -v
	docker run -it --rm crossbario/autobahn-js:alpine node -v

autobahn_version:
	docker run -it --rm crossbario/autobahn-js:full sh -c "echo \"console.log('autobahn-' + require('autobahn').version + ' is installed');\" | node"
	docker run -it --rm crossbario/autobahn-js:alpine sh -c "echo \"console.log('autobahn-' + require('autobahn').version + ' is installed');\" | node"


ping: ping_full ping_alpine

ping_full:
	docker run --add-host=crossbar:$(HOSTIP) -it --rm crossbario/autobahn-js:full ping crossbar

ping_alpine:
	docker run --add-host=crossbar:$(HOSTIP) -it --rm crossbario/autobahn-js:alpine ping crossbar


test: test_full test_alpine

test_full:
	docker run -it --rm --link crossbar crossbario/autobahn-js:full

test_alpine:
	docker run -it --rm --link crossbar crossbario/autobahn-js:alpine


publish: publish_full publish_alpine

publish_alpine: build_alpine
	docker push crossbario/autobahn-js
	docker push crossbario/autobahn-js:alpine
	docker push crossbario/autobahn-js:alpine-${AUTOBAHN_JS_VERSION}

publish_full: build_full
	docker push crossbario/autobahn-js:full
	docker push crossbario/autobahn-js:full-${AUTOBAHN_JS_VERSION}


list:
	-docker images crossbario/autobahn-js:*

clean:
	./removeall.sh
