# Building Autobahn|JS

To build **Autobahn|JS** for use in browsers, you will need

-   [Node.js](http://nodejs.org/)
-   [Google Closure Compiler](http://dl.google.com/closure-compiler/compiler-latest.zip)
-   [SCons](http://www.scons.org/)
-   [Taschenmesser](https://github.com/oberstet/taschenmesser)
-   [browserify](http://browserify.org/)
-   [ws](http://websockets.github.io/ws/)
-   [crypto-js](https://www.npmjs.org/package/crypto-js)


## Installing build requirements

Install [Node.js](http://nodejs.org/)

    sudo apt-get install -y nodejs nodejs-legacy npm

Install browserify

    sudo npm install -g browserify

Install Python tools (preferrably into a dedicated virtualenv)

    pip install -U scons boto scour taschenmesser

Install Java JDK

    sudo apt install -y openjdk-8-jdk

Install

    cd ~
    rm -f compiler-latest.zip
    wget https://dl.google.com/closure-compiler/compiler-latest.zip
    unzip -o compiler-latest.zip

This will produce a file like `closure-compiler-v20161024.jar` in your `$HOME`.

Install library dependencies

    sudo npm install -g ws when crypto-js msgpack-lite utf-8-validate

Set environment variables (add that to `$HOME/.profile`):

    export JS_COMPILER=$HOME/closure-compiler-v20161024.jar
    export JAVA_HOME=/usr/lib/jvm/default-java
    export NODE_PATH=/usr/local/lib/node_modules/








**Clone the Autobahn|JS repo**

    git clone git@github.com:tavendo/AutobahnJS.git
    cd autobahnjs

**Install JavaScript dependencies in NodeJS**

    npm install ws when crypto-js msgpack-lite utf-8-validate

**Start the build**:

    scons

> **note**
>
> When using a bash shell under Windows (e.g. git shell), use 'scons.py'.

**You get 3 files inside the** `build` **directory**

    build/autobahn.js
    build/autobahn.min.js
    build/autobahn.min.jgz

To **clean up your build** (i.e. remove previously created files):

    scons -uc
