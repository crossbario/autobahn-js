# Votes Demo

The votes demo is a basic application intended to give an introduction to WAMP application programming. 

It allows voting for one of three flavors of ice cream. Votes are synchronized between all connected browser frontends via a backend which is also running in a browser tab.

The demo code covers both the RPC and PubSub messaging pattern which WAMP inlcudes for application messaging. 

The demo uses the [Autobahn|JS](http://autobahn.ws/js/) library to provide WAMP functionality  is primarily intended to be run with [Crossbar.io](http://crossbar.io/), but will work with other WAMP routers.

## Run using Crossbar.io

You need to install Crossbar.io. With Python 2.7 (and `pip`) installed, this can be as easy as

```
pip install crossbar
```

Depending on your system, you may need to ensure that other requirements are met. The [Quick Start guide](http://crossbar.io/docs/Quick-Start/) gives more information on this, an contains links to instructions for specific operating systems.

Crossbar.io contains a template for this demo, so it is easiest to use this. Open a command shell and go to a directory in which you want to install the demo. Do

```
crossbar init --template votes:browser
```

Once this is finished, you can start the demo by

```
crossbar start
```

Crossbar.io includes a static Web server, and the template configures this so that the demo files are served.

You can then access the demo by pointing your Web browser to 

```
http://localhost:8080/
```

This will display a page from which you can start one backend and as many frontends as you want.

## Run using another WAMP router

Alternatively, you can use the demo with a [WAMP router](http://wamp.ws/implementations/) of your choosing.

Clone the repository, and possibly adjust the connection information in the JavaScript files for the frontend and backend to point to this WAMP router. The frontend and backend can then be run directly from files. (Using a local Web server will not work without alterations, since the demo assumes that the WebSocket transport is on the same IP + protocol as it is served from.)
