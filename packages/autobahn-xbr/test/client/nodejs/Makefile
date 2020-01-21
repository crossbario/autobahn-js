.PHONY: deps seller buyer

all:
	@echo "Targets:"
	@echo ""
	@echo "   clean           Clean everything"
	@echo "   install         Install runtime dependencies"
	@echo "   seller          Run the XBR seller component"
	@echo "   buyer           Run the XBR buyer component"
	@echo ""

clean:
	-rm -rf ./node_modules
	-rm ./package-lock.json

seller:
	node seller.js

buyer:
	node buyer.js

install:
	npm install

install_local:
	npm install ~/scm/crossbario/autobahn-js/packages/autobahn
	npm install ~/scm/crossbario/autobahn-js/packages/autobahn-xbr
