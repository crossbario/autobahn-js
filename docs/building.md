# Building Autobahn|JS

The following describes how to build and publish **Autobahn|JS** for browser and Node.


## Build environment (browser build)

Install [Node.js](http://nodejs.org/)

    sudo apt-get install -y nodejs nodejs-legacy npm

Install [browserify](http://browserify.org/)

    sudo npm install -g browserify nodeunit

Install Python tools (preferrably into a dedicated virtualenv)

    pip install -U scons boto scour taschenmesser

Install Java JDK

    sudo apt install -y openjdk-8-jdk

Install [Google Closure Compiler](https://developers.google.com/closure/compiler/)

    cd ~
    rm -f compiler-latest.zip
    wget https://dl.google.com/closure-compiler/compiler-latest.zip
    unzip -o compiler-latest.zip

This will produce a file like `closure-compiler-v20161024.jar` in your `$HOME`.

Install library dependencies

    sudo npm install -g ws when crypto-js \
      tweetnacl msgpack-lite int64-buffer bufferutil utf-8-validate

Set environment variables (add that to `$HOME/.profile`):

    export JS_COMPILER=$HOME/closure-compiler-v20161024.jar
    export JAVA_HOME=/usr/lib/jvm/default-java
    export NODE_PATH=/usr/local/lib/node_modules/


## Building for browsers

To start the build:

    scons

To clean up your build:

    scons -uc

Here is a typical build output (*some* warnings are "ok" - they come from dependencies we don't control):


```console
(cpy2712_1) oberstet@office-corei7:~/scm/crossbario/autobahn-js$ scons
scons: Reading SConscript files ...
Building AutobahnJS 0.11.0
scons: done reading SConscript files.
scons: Building targets ...
browserify lib/autobahn.js --standalone autobahn -o build/autobahn.js
js_builder(["build/autobahn.min.js"], ["build/autobahn.js"])
java -jar /home/oberstet/closure-compiler-v20161024.jar --compilation_level SIMPLE_OPTIMIZATIONS --js build/autobahn.js --js_output_file build/autobahn.min.js
build/autobahn.js:772: WARNING - Suspicious negated left operand of in operator.
      while ( k < len && ! k in t ) k++;
                         ^

build/autobahn.js:866: WARNING - Suspicious negated left operand of in operator.
      while ( k >= 0 && ! k in t ) k--;
                        ^

build/autobahn.js:6098: WARNING - Suspicious code. The result of the 'getprop' operator is not being used.
  array.byteLength // this throws if `array` is not a valid ArrayBuffer
  ^

build/autobahn.js:15857: WARNING - Suspicious code. The result of the 'not' operator is not being used.
!function(exports) {
^

0 error(s), 4 warning(s)
gzipper(["build/autobahn.min.jgz"], ["build/autobahn.min.js"])
checksumsMD5(["build/CHECKSUM.MD5"], ["build/autobahn.js", "build/autobahn.min.js", "build/autobahn.min.jgz"])
checksumsSHA1(["build/CHECKSUM.SHA1"], ["build/autobahn.js", "build/autobahn.min.js", "build/autobahn.min.jgz"])
checksumsSHA256(["build/CHECKSUM.SHA256"], ["build/autobahn.js", "build/autobahn.min.js", "build/autobahn.min.jgz"])
Copy("build/LICENSE", "LICENSE")
scons: done building targets.
```

This should produce the following build artifacts:

```console
(cpy2712_1) oberstet@office-corei7:~/scm/crossbario/autobahn-js$ ls -la build/
insgesamt 896
drwxrwxr-x 2 oberstet oberstet   4096 Nov 15 10:51 .
drwxrwxr-x 7 oberstet oberstet   4096 Nov 15 10:51 ..
-rw-rw-r-- 1 oberstet oberstet 573208 Nov 15 10:51 autobahn.js
-rw-rw-r-- 1 oberstet oberstet  58009 Nov 15 10:51 autobahn.min.jgz
-rw-rw-r-- 1 oberstet oberstet 198906 Nov 15 10:51 autobahn.min.js
-rw-rw-r-- 1 oberstet oberstet    168 Nov 15 10:51 CHECKSUM.MD5
-rw-rw-r-- 1 oberstet oberstet    195 Nov 15 10:51 CHECKSUM.SHA1
-rw-rw-r-- 1 oberstet oberstet    273 Nov 15 10:51 CHECKSUM.SHA256
-rw-rw-r-- 1 oberstet oberstet   1086 Nov 15 10:46 LICENSE
```
