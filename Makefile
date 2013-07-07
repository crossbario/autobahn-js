# When on Windows and starting GNU make from Git bash, we need to set this:
ifdef COMSPEC
   SHELL=C:/Windows/System32/cmd.exe
endif

all:
	scons -uc
	scons
	cp build/autobahn.* ../WebMQ/webmq/webmq/static/jsdep/
	cp build/autobahn.* ../WebMQDemo/web/js/
