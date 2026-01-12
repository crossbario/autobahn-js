# Examples Overview

The examples give an overview of the features of WAMP by providing working code.

Read, run, and modify as you like!

There are two main sources of examples:

-   the [Autobahn|Python repository](https://github.com/crossbario/autobahn-python/tree/master/examples) - for an overview see the [Autobahn|Python documentation](http://autobahn.ws/python/wamp/examples.html)
-   the [Crossbar.io examples repository](https://github.com/crossbario/crossbarexamples) - for an overview see [the Crossbar.io documentation](http://crossbar.io/docs/Examples/)

> **note**
>
> The JavaScript code provided generally runs both in the browser and in Node.js. When using the browser, load the JavaScript via the provided HTML page. Each example also contains Python versions. Python and JavaScript versions are interoperable: You may run e.g. a JavaScript subscriber and a Python publisher.

Running examples
================

All examples require a WAMP router.

We suggest using [Crossbar.io](http://crossbar.io), an open source WAMP application router.

For the installation of Crossbar.io, see the [project documentation](http://crossbar.io/docs/Quick-Start/).

Examples from the Autobahn|Python repo
--------------------------------------

Once you've installed Crossbar.io, open a command shell, create a test directory, initialize Crossbar.io and start it.

    mkdir test1
    cd test 1
    crossbar init
    crossbar start

Code runs both in the browser and in Node.js.

For the latter, you need to have **Autobahn|JS** installed. To do so, in a shell do

    npm install autobahn
    npm install when

Examples from the crossbarexamples repo
---------------------------------------

The examples here all include a Crossbar.io configuration for the example.

So do

    crossbar start

in the example directory and then open a Web browser to 'localhost:8080'.
