.PHONY: build

HOSTIP=$(shell ip route get 1 | awk '{print $$NF;exit}')

default:
	@echo "Targets: build, test, publish, .."


qemu_deps:
	mkdir -p ./.qemu
	cp /usr/bin/qemu-arm-static ./.qemu/


build: build_full build_alpine

build_full:
	time docker build \
		--build-arg BUILD_DATE=${BUILD_DATE} \
		--build-arg AUTOBAHN_JS_VCS_REF=${AUTOBAHN_JS_VCS_REF} \
		--build-arg AUTOBAHN_JS_VERSION=${AUTOBAHN_JS_VERSION} \
		-t crossbario/autobahn-js-armhf \
		-t crossbario/autobahn-js-armhf:latest \
		-t crossbario/autobahn-js-armhf:full \
		-t crossbario/autobahn-js-armhf:full-${AUTOBAHN_JS_VERSION} \
		-f Dockerfile.full .

build_alpine:
	@echo "FIXME: crossbario/autobahn-js-armhf:alpine is broken"
	time docker build \
		--build-arg BUILD_DATE=${BUILD_DATE} \
		--build-arg AUTOBAHN_JS_VCS_REF=${AUTOBAHN_JS_VCS_REF} \
		--build-arg AUTOBAHN_JS_VERSION=${AUTOBAHN_JS_VERSION} \
		-t crossbario/autobahn-js-armhf:alpine \
		-t crossbario/autobahn-js-armhf:alpine-${AUTOBAHN_JS_VERSION} \
		-f Dockerfile.alpine .


version: os_version node_version autobahn_version

os_version:
	docker run -it --rm crossbario/autobahn-js-armhf:full uname -a
	docker run -it --rm crossbario/autobahn-js-armhf:alpine uname -a

node_version:
	docker run -it --rm crossbario/autobahn-js-armhf:full node -v
	docker run -it --rm crossbario/autobahn-js-armhf:alpine node -v

autobahn_version:
	docker run -it --rm crossbario/autobahn-js-armhf:full sh -c "echo \"console.log('autobahn-' + require('autobahn').version + ' is installed');\" | node"
	docker run -it --rm crossbario/autobahn-js-armhf:alpine sh -c "echo \"console.log('autobahn-' + require('autobahn').version + ' is installed');\" | node"


ping: ping_full ping_alpine

ping_full:
	docker run --add-host=crossbar:$(HOSTIP) -it --rm crossbario/autobahn-js-armhf:full ping crossbar

ping_alpine:
	docker run --add-host=crossbar:$(HOSTIP) -it --rm crossbario/autobahn-js-armhf:alpine ping crossbar


test: test_full test_alpine

test_full:
	docker run -it --rm --link crossbar crossbario/autobahn-js-armhf:full

test_alpine:
	docker run -it --rm --link crossbar crossbario/autobahn-js-armhf:alpine


publish: publish_full publish_alpine

publish_alpine: build_alpine
	docker push crossbario/autobahn-js-armhf:alpine
	docker push crossbario/autobahn-js-armhf:alpine-${AUTOBAHN_JS_VERSION}

publish_full: build_full
	docker push crossbario/autobahn-js-armhf
	docker push crossbario/autobahn-js-armhf:latest
	docker push crossbario/autobahn-js-armhf:full
	docker push crossbario/autobahn-js-armhf:full-${AUTOBAHN_JS_VERSION}


list:
	-docker images crossbario/autobahn-js-armhf:*

clean:
	./removeall.sh
