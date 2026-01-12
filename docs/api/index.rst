=============
API Reference
=============

This section contains the complete API documentation for Autobahn|JS,
generated from JSDoc comments in the source code.

Core Classes
------------

Connection
^^^^^^^^^^

.. js:autoclass:: Connection
   :members:

Session
^^^^^^^

.. js:autoclass:: Session
   :members:

Serializers
-----------

.. js:autoclass:: JSONSerializer
   :members:

.. js:autoclass:: MsgpackSerializer
   :members:

.. js:autoclass:: CBORSerializer
   :members:

Transports
----------

.. js:autoclass:: WebSocketTransport
   :members:

.. js:autoclass:: RawSocketTransport
   :members:

Authentication
--------------

.. js:autofunction:: auth_cra.sign

.. js:autofunction:: auth_cra.derive_key

Exceptions
----------

.. js:autoclass:: Error
   :members:

Utility Classes
---------------

Registration
^^^^^^^^^^^^

.. js:autoclass:: Registration
   :members:

Subscription
^^^^^^^^^^^^

.. js:autoclass:: Subscription
   :members:

Publication
^^^^^^^^^^^

.. js:autoclass:: Publication
   :members:

.. note::

   The API documentation is generated using `sphinx-js <https://github.com/mozilla/sphinx-js>`_
   from JSDoc comments in the source code. If you find missing or incorrect
   documentation, please `open an issue <https://github.com/crossbario/autobahn-js/issues>`_.
