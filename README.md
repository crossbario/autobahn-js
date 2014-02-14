# AutobahnJS

AutobahnJS implements **[The Web Application Messaging Protocol V2](http://wamp.ws/)** in JavaScript.

WAMP provides asynchronous **Remote Procedure Calls** and **Publish & Subscribe** for applications in *one* protocol running over [WebSocket](http://tools.ietf.org/html/rfc6455).

AutobahnJS runs on both **Web browsers** and **[Node.js](http://nodejs.org/)**, and implements the following WAMP roles:

1. Caller
2. Callee
3. Publisher
4. Subscriber

AutobahnJS is part of the [Autobahn project](http://autobahn.ws/), [MIT licensed](/LICENSE), and full source code can be found on [GitHub](https://github.com/tavendo/AutobahnJS/).


# Show me some code!

Here is how programming with AutobahnJS looks like (identical code runs in browsers and on NodeJS):

```javascript
var autobahn = require('autobahn');

var connection = new autobahn.Connection({url: 'ws://127.0.0.1:9000/', realm: 'realm1'});

connection.onopen = function (session) {

   // 1) subscribe on a topic
   function onevent(args) {
      console.log("Event:", args[0]);
   }
   session.subscribe(onevent, 'com.myapp.hello');

   // 2) publish an event
   session.publish('com.myapp.hello', ['Hello, world!']);

   // 3) register a procedure for remoting
   function add2(args) {
      return args[0] + args[1];
   }
   session.register(add2, 'com.myapp.add2');

   // 4) call a remote procedure
   session.call('com.myapp.add2', [2, 3]).then(
      function (res) {
         console.log("Result:", res);
      }
   );
};

connection.open();
```


# Getting started

To use AutobahnJS in your application, you need a WAMP v2 compatible **application router**.

The application router is responsible for call and event routing between your application's components. The router itself will not run any application code.

With AutobahnJS, you can program application components in JavaScript, and those components can be hosted in browsers or NodeJS.

WAMP implementations need to catch up with V2 of WAMP, and currently, the only WAMP v2 compatible router is included with [**Autobahn**|Python](https://github.com/tavendo/AutobahnPython).

You can find complete examples [here](https://github.com/tavendo/AutobahnPython/tree/master/examples/twisted/wamp/basic).


## NodeJS

You can get AutobahnJS for NodeJS using the Node Package Manager:

	npm install autobahn

and then, in your code

	var autobahn = require('autobahn')

## Browsers

You can get the **latest** (= WAMPv2 only) prebuilt AutobahnJS release from here:

  1. [Production (minimized and gzipped)](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz)
  2. [Production (only minimized)](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.js)
  3. [Development](https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.js)

The **old** AutobahnJS for WAMPv1 is still available from here:

  1. [Production (minimized and gzipped)](http://autobahn.s3.amazonaws.com/js/autobahn.min.jgz)
  2. [Production (only minimized)](http://autobahn.s3.amazonaws.com/js/autobahn.min.js)
  3. [Development](http://autobahn.s3.amazonaws.com/js/autobahn.js)

> You can use above via direct linking for *development purposes*, but please do not hotlink for production. It won't work anyway, since we restrictions on HTTP referer.


# API

## Publish

To publish an event on a `session`:

```javascript
var d = session.publish(<topic>, <args>, <kwargs>, <options>);
```

where

 1. `<topic>` is the URI of the topic to publish to
 2. `<args>` is application event payload (a *list* giving the positional arguments)
 3. `<kwargs>` is application event payload (a *dictionary* giving the keyword arguments)
 4. `<options>` specifies options for publication.
 
and returns either nothing or a *promise* if `options.acknowledge` is set.

The latter promise returned will resolve to an instance of `autobahn.Publication` when the publish was successful, or reject with an `autobahn.Error` when the publish was unsuccessful. 

*Example* Unacknowledged publish.

```javascript
session.publish('com.myapp.hello', ['Hello, world!']);
```

*Example* Acknowledged publish.

```javascript
session.publish('com.myapp.hello', ['Hello, world!']).then(
   function (publication) {
      // publish was successful
   },
   function (error) {
      // publish failed
   };
```



# Where to go

For more information, including getting started, tutorials and reference documentation, please visit the project's [homepage](http://autobahn.ws/js).


# Get in touch

Get in touch on IRC `#autobahn` on `chat.freenode.net` or the [mailing list](http://groups.google.com/group/autobahnws).


# Acknowledgements

AutobahnJS includes code from the following open-source projects

  * [when.js](https://github.com/cujojs/when)
  * [CryptoJS](http://code.google.com/p/crypto-js/)

Special thanks to the [Coders with an Unhealthy Javascript Obsession](http://cujojs.com/) for creating *when.js - A lightweight Promise and when() implementation, plus other async goodies.*


# Building

To build AutobahnJS for use in browsers, you will need

  * [Nodejs](http://nodejs.org/)
  * [Google Closure Compiler](http://dl.google.com/closure-compiler/compiler-latest.zip)
  * [SCons](http://www.scons.org/)
  * [Taschenmesser](https://github.com/oberstet/taschenmesser)

SCons is a Python based build tool, so you will need [Python](http://python.org/) as well. Taschenmesser is an SCons toolbelt also written in Python.

Set environment variables:

  1. `JAVA_HOME` pointing to your Java run-time
   
  		C:\Program Files\Java\jre7

  2. Add Python and Python script to `PATH`
		
 		C:\Python27;C:\Python27\Scripts;

  3. Set `JS_COMPILER` pointing to the Google Closure `compiler.jar`
  
		C:\Program Files\Google Closure\compiler.jar

Now clone the repo:

	git clone git://github.com/tavendo/AutobahnJS.git
	cd AutobahnJS

Then start the build:

	scons

This will produce 3 files inside the `build` directory:

    build/autobahn.js
    build/autobahn.min.js
    build/autobahn.min.jgz

To clean up your build:

	scons -uc
