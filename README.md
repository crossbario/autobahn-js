# AutobahnJS

AutobahnJS is a JavaScript client library that implements **[The WebSocket Application Messaging Protocol (WAMP)](http://wamp.ws/)**:

 * implements WAMP v1, works with any WAMP server
 * provides asynchronous RPC and PubSub messaging patterns
 * easy to use Promise-based API
 * pluggable promises/deferreds: use when.js (built-in), jQuery, Dojo or others
 * flexible, automatic reconnect
 * session authentication (WAMP-CRA)
 * no dependencies
 * tiny size (97kB source, 27kB minified, 9kB compressed)
 * Open-Source (MIT License)


## Get it

You can link to the latest prebuilt AutobahnJS release hosted on Amazon S3 here

  1. [Production (minimized and gzipped)](http://autobahn.s3.amazonaws.com/js/autobahn.min.jgz)
  2. [Production (only minimized)](http://autobahn.s3.amazonaws.com/js/autobahn.min.js)
  3. [Development](http://autobahn.s3.amazonaws.com/js/autobahn.js)


## What is that?

[WebSocket](http://tools.ietf.org/html/rfc6455) is already built into
modern browsers and provides bidirectional low-latency messaging.

However, as such, it is quite low-level. Web apps often have a need for
higher level messaging patterns:

  * Publish & Subscribe
  * Remote Procedure Calls

This is where [WAMP](http://wamp.ws/) enters. WAMP runs on top of raw WebSocket and provides *asynchronous RPC and PubSub*.

Technically, WAMP is a proper WebSocket *subprotocol* that uses JSON as
message serialization format. WAMP was designed to be easy to use and
simple to implement.

AutobahnJS implements WAMP in JavaScript to be used in browser based applications.

**ExtJS Extension**

AutobahnExtJS provides and Autobahn/WAMP proxy and support code for Sencha ExtJS. Please see the `autobahnextjs` folder for code and more information.


## Where to go

For more information, including getting started, tutorials and reference documentation, please visit the project's [homepage](http://autobahn.ws/js).


## Get in touch

Get in touch on IRC #autobahn on chat.freenode.net or join the [mailing list](http://groups.google.com/group/autobahnws).


## Acknowledgements

AutobahnJS includes code from the following open-source projects

  * [when.js](https://github.com/cujojs/when)
  * [CryptoJS](http://code.google.com/p/crypto-js/)

Special thanks to the [Coders with an Unhealthy Javascript Obsession](http://cujojs.com/) for creating *when.js - A lightweight Promise and when() implementation, plus other async goodies.*


# Building

Building AutobahnJS will create a single file, minimized version of the library.

To build, you will need

  * [Google Closure Compiler](http://closure-compiler.googlecode.com/files/compiler-latest.zip)
  * [SCons](http://www.scons.org/)

SCons is a Python based build tool, so you will need [Python](http://python.org/) as well.

Set environment variables:

  1. JAVA_HOME pointing to your Java run-time, e.g.
   
  		C:\Program Files\Java\jre7

  2. adding Python & Python scripts to PATH, e.g.  		
		
 		C:\Python27;C:\Python27\Scripts;

  3. JS_COMPILER pointing to the Google Closure compiler.jar
  
		C:\Program Files\Google Closure\compiler.jar

 

Now clone the repo:

	git clone git://github.com/tavendo/AutobahnJS.git

You need to include the submodules (i.e. currenlty when.js):

	cd AutobahnJS
	git submodule init

and then update them

	git submodule update 

Updating CryptoJS needs to be done manually, since they are not on Git.


For  a release version, set the appropriate AutobahnJS version in 'version.txt', e.g 

    vi version.txt

Scons currently needs to be run from the Windows shell, so open one, go to the AutobahnJS directory, and run

	scons

This will produce 2 files

    build/autobahn.js
    build/autobahn.min.js

To clean up your build

	scons -uc


# Publishing

Tavendo provides hosting of AutobahnJS on Amazon S3 at:

    https://autobahn.s3.amazonaws.com/js/

Set AWS credentials in `$HOME/.boto` (or `C:\Users\johndoe\.boto` for Windows):

    [Credentials]
    aws_access_key_id = ABCDEFGHJIKLMNOPQRTUVXYZ
    aws_secret_access_key = 0123456789ABCDEFGHJIKLMNOPQRTUVXYZ
    
You will also need [Boto](http://docs.pythonboto.org) installed:

    easy_install boto

To publish, then do

    scons publish
