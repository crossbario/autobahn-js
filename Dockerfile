FROM ubuntu:bionic

RUN    apt-get update \
    && apt-get install -y npm \
                          nodejs \
                          nodejs-dev \
                          default-jre \
                          python \
                          python-pip \
                          wget \
                          curl \
                          unzip \
                          git-core \
                          build-essential \
                          autotools-dev \
                          autoconf \
                          libtool \
                          cmake \
                          scons \
                          zlib1g-dev \
                          libbz2-dev \
                          libssl1.0-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# https://nodejs.org/dist/v6.10.3/node-v6.10.3-linux-x64.tar.xz
# tar xvf node-v*.tar.?z --strip-components=1 -C ./node
#     sudo ln -s /opt/node/bin/node /usr/local/bin/node
#     sudo ln -s /opt/node/bin/npm /usr/local/bin/npm


RUN pip install -U scons boto taschenmesser

VOLUME /work
WORKDIR /work

ENV JAVA_HOME /usr/lib/jvm/default-java
ENV JS_COMPILER /work/node_modules/google-closure-compiler-java/compiler.jar

CMD ["make", "build_browser_docker"]
