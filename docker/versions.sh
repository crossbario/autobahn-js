#!/bin/sh

#
# CHANGE FOR NEW RELEASES (these need to be proper Git tags in the respective repo):
#
export AUTOBAHN_JS_VERSION='19.10.1'
export AUTOBAHN_JS_XBR_VERSION='19.10.1'
#
# END OF CONFIG
#

#
# Git working directories of all relevant repos must reside
# in parallel (as siblings) to this repository
#
# export AUTOBAHN_PYTHON_VERSION=$(grep -E '^(__version__)' ../autobahn/_version.py | cut -d ' ' -f3 | sed -e 's|[u"'\'']||g')
export AUTOBAHN_JS_VCS_REF=`git --git-dir="../.git" rev-list -n 1 v${AUTOBAHN_JS_VERSION} --abbrev-commit`
export BUILD_DATE=`date -u +"%Y-%m-%d"`

echo ""
echo "The Crossbar.io Project (build date ${BUILD_DATE})"
echo ""
echo "autobahn-js ${AUTOBAHN_JS_VERSION} [${AUTOBAHN_JS_VCS_REF}]"
echo "autobahn-js-xbr ${AUTOBAHN_JS_XBR_VERSION} [${AUTOBAHN_JS_VCS_REF}]"
echo ""
