.. _building:

Building Autobahn|JS
====================

To build |ab| for use in browsers, you will need

* `Node.js <http://nodejs.org/>`_
* `Google Closure Compiler <http://dl.google.com/closure-compiler/compiler-latest.zip>`_
* `SCons <http://www.scons.org/>`_
* `Taschenmesser <https://github.com/oberstet/taschenmesser>`_
* `browserify <http://browserify.org/>`_
* `ws <http://einaros.github.io/ws/>`_
* `crypto-js <https://www.npmjs.org/package/crypto-js>`_

**Install NodeJS**

*on Windows*

Download the installer from `the NodeJS website <http://nodejs.org/download/>`_.

*on Ubuntu*

::

   sudo apt-get install nodejs nodejs-legacy npm



SCons is a Python based build tool, so you will need `Python <http://python.org/>`_ as well.

**Install Taschenmesser**, a SCons toolbelt also written in Python

*on Windows*

::

   pip install --upgrade taschenmesser[aws,svg]

*on Ubuntu*

::

    sudo pip install --upgrade taschenmesser[aws,svg]

**Set environment variables**

*on Windows*

1. ``JAVA_HOME`` pointing to your Java run-time

::

      C:\Program Files\Java\jre7


2. Add Python and Python script to ``PATH``

::

      C:\Python27;C:\Python27\Scripts;


3. Set ``JS_COMPILER`` pointing to the Google Closure ``compiler.jar``

::

      C:\Program Files\Google Closure\compiler.jar

*on Ubuntu*

::

    export JS_COMPILER=$HOME/compiler.jar
    export JAVA_HOME=/usr/lib/jvm/default-java

**Clone the Autobahn|JS repo**

::

    git clone git@github.com:tavendo/AutobahnJS.git
    cd autobahnjs

**Install JavaScript dependencies in NodeJS**

::

    npm install ws when crypto-js

**Start the build**:

::

    scons

.. note:: When using a bash shell under Windows (e.g. git shell), use 'scons.py'.

**You get 3 files inside the** ``build`` **directory**

::

    build/autobahn.js
    build/autobahn.min.js
    build/autobahn.min.jgz

To **clean up your build** (i.e. remove previously created files):

::

    scons -uc
