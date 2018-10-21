#FROM aarch64/node
FROM aarch64/node:7.7.2

COPY .qemu/qemu-aarch64-static /usr/bin/qemu-aarch64-static

MAINTAINER The Crossbar.io Project <support@crossbario.com>

# Metadata
ARG AUTOBAHN_JS_VERSION
ARG BUILD_DATE
ARG AUTOBAHN_JS_VCS_REF

# Metadata labeling
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="AutobahnJS Starter Template" \
      org.label-schema.description="Quickstart template for application development with AutobahnJS" \
      org.label-schema.url="http://crossbar.io" \
      org.label-schema.vcs-ref=$AUTOBAHN_JS_VCS_REF \
      org.label-schema.vcs-url="https://github.com/crossbario/autobahn-js" \
      org.label-schema.vendor="The Crossbar.io Project" \
      org.label-schema.version=$AUTOBAHN_JS_VERSION \
      org.label-schema.schema-version="1.0"

# Application home
ENV HOME /app
ENV DEBIAN_FRONTEND noninteractive
ENV NODE_PATH /usr/local/lib/node_modules

# Crossbar.io connection defaults
ENV CBURL ws://crossbar:8080/ws
ENV CBREALM realm1

# make sure HOME exists!
RUN mkdir /app

# set the app component directory as working directory
WORKDIR /app

# see:
# - https://github.com/npm/uid-number/issues/3#issuecomment-287413039
# - https://github.com/tootsuite/mastodon/issues/802
RUN npm config set unsafe-perm true

# install Autobahn|JS
#https://github.com/npm/npm/issues/17431#issuecomment-325892798
RUN npm install -g --unsafe-perm node-gyp
RUN npm install -g --unsafe-perm autobahn@${AUTOBAHN_JS_VERSION}

# add example service
COPY ./app/* /app/

# make /app a volume to allow external configuration
VOLUME /app

# run service entry script by default
CMD ["sh", "/app/run"]
