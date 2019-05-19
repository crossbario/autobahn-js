import os
import hashlib

from twisted.internet.defer import inlineCallbacks

from txaio import make_logger
from autobahn import wamp
from autobahn.twisted.wamp import ApplicationSession


class Backend(ApplicationSession):

    log = make_logger()

    def __init__(self, config):
        self.log.info('Backend.__init__(config={config})', config=config)
        ApplicationSession.__init__(self, config)

    @inlineCallbacks
    def onJoin(self, details):
        self.log.info('Backend.onJoin(details={details})', details=details)
        regs = yield self.register(self)
        self.log.info('Registered procedures {regs}', regs=[r.procedure for r in regs if r])

    @wamp.register('any.echo')
    def echo(self, whatever):
        return whatever

    @wamp.register('binary.random')
    def random(self, len=32):
        assert type(len) == int
        return os.urandom(len)

    @wamp.register('binary.concat')
    def concat(self, xbytes, ybytes):
        assert type(xbytes) == bytes
        assert type(ybytes) == bytes      
        return xbytes + ybytes

    @wamp.register('binary.hash')
    def hash(self, xbytes):
        assert type(xbytes) == bytes
        return hashlib.sha256(xbytes).digest()

    @wamp.register('binary.reversed')
    def reversed(self, xbytes):
        assert type(xbytes) == bytes
        return bytes(reversed(xbytes))
