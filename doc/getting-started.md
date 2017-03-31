# Getting Started

With **Autobahn|JS**, you can develop application components in JavaScript, and those components can be hosted inside **browsers**, **Node.js** and **PostgreSQL** (*under development*).

This page explains what you need in order to include **Autobahn|JS** in your projects, and to route your application messages.

WAMP router
===========

**Autobahn|JS** does not connect application components directly to each other, but enables a connection to a WAMP router. This connects the application components. The routing is rule-based - no application code runs inside the router.

You can find a [list of WAMP v2 compatible routers](http://wamp.ws/implementations/) at the WAMP project site. We recommend using [Crossbar.io](https://github.com/crossbario/crossbar), which offers a lot of features, but the examples here should work with any WAMP router.

Example Code
============

You can find complete examples for code running in both the browser and Node.js in the [Autobahn|Python Github repository](https://github.com/crossbario/autobahn-python/tree/master/examples/twisted/wamp/basic). (The examples are also provided in Python versions.)

Node.js
=======

You can get **Autobahn|JS** for Node.js using the Node Package Manager:

> `npm install autobahn`

and then, in your code

``` js
var autobahn = require('autobahn')
```

> **note**
>
> On Windows, ignore any potential error messages regarding missing Visual C++ components. **Autobahn|JS** depends on packages which try to build native extensions for higher performance - but that is not strictly necessary for running it.

Docker
------

We offer a [Docker Image](https://hub.docker.com/r/crossbario/autobahn-js/) with Node.js and **Autobahn|JS** pre-installed. To use this, if you have Docker already installed, just do

> `sudo docker run -it crossbario/autobahn-js node root/client.js ws://IP_of_WAMP_router/ws realm1`

This starts up a Docker container and client.js, which connects to a Crossbar.io router at the given URL and to the given realm.

Browsers
========

You can get the **latest** pre-built **Autobahn|JS** release from the [autobahn-js-built repository](https://github.com/crossbario/autobahn-js-built):


1.  Production (minimized and gzipped)
2.  Production (only minimized)
3.  Development


AMD and RequireJS
=================

If you are using a module system like [RequireJS](http://requirejs.org/), you can use **Autobahn|JS** like so:

``` html
<!DOCTYPE html>
<html>
<body>
<script src="http://requirejs.org/docs/release/2.1.11/minified/require.js"></script>
<script>
    require.config({
        baseUrl: ".",
        paths: {
            "autobahn":
               "https://path_to_your_hosted_version_of_autobahn/autobahn.min.js",
            "when": "https://cdnjs.cloudflare.com/ajax/libs/when/2.7.1/when"
        },
        shim: {
            "autobahn": {
                deps: ["when"]
            }
        }
    });
    require(["autobahn"], function(autobahn) {
        console.log("Ok, Autobahn loaded", autobahn.version);
    });
</script>
</body>
</html>
```

Building **Autobahn|JS** -------------

Instead of using the versions provided for download (browser) or via npm (Node.js), you can also build **Autobahn|JS** from the GitHub repository.

Doing so allows you to use forks of **Autobahn|JS**, e.g. ones which may implement features you desire, but which have not made it into the mainstream version.

It also allows you to hack on **Autobahn|JS** yourself.

To build **Autobahn|JS**, follow the instructions in [Building](building.md);

Running a WAMP router
=====================

To route your application messages, your application components, e.g. your browser frontend and your backend on the server, need to connect to a WAMP router which then routes the events and calls.

Several [WAMP router implementations exist](http://wamp.ws/implementations/), across several languages.

We suggest using Crossbar.io, which not only offers stable, performant and scalable WAMP routing, but also other features such as application scaffolding and hosting of application components.

For Crossbar.io, you can take a look at the [quick start instructions](http://crossbar.io/docs/Quick-Start/).

What now?
=========

-   Take a look at [Programming](programming.md), which gives an overview of how to connect your application components, and do basic RPC and PubSub.
-   If you want to see some **live Web apps** using **Autobahn|JS**? Take a look at the [Crossbar.io demos](http://crossbar.io/).
