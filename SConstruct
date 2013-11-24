###############################################################################
##
##  Copyright 2012-2013 Tavendo GmbH
##
##  Licensed under the Apache License, Version 2.0 (the "License");
##  you may not use this file except in compliance with the License.
##  You may obtain a copy of the License at
##
##      http://www.apache.org/licenses/LICENSE-2.0
##
##  Unless required by applicable law or agreed to in writing, software
##  distributed under the License is distributed on an "AS IS" BASIS,
##  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
##  See the License for the specific language governing permissions and
##  limitations under the License.
##
###############################################################################

import os
import pkg_resources

#taschenmesser = pkg_resources.resource_filename('taschenmesser', '..')
taschenmesser = "../../infrequent/taschenmesser"
env = Environment(tools = ['default', 'taschenmesser'],
                  toolpath = [taschenmesser],
                  ENV = os.environ)


env['JS_DEFINES' ] = {
   'AUTOBAHNJS_VERSION': "'%s'" % open('version.txt').read().strip()
}

sources = ["autobahn/license.js",
           "autobahn/loadershim.js",
           "autobahn/normalizeconsole.js",
           "when/when.js",
           "cryptojs/components/core.js",
           "cryptojs/components/enc-base64.js",
           "cryptojs/components/hmac.js",
           "cryptojs/components/sha256.js",
           "cryptojs/components/pbkdf2.js",
           "autobahn/autobahn.js",
           "autobahn/useragent.js"]

# NONE | WHITESPACE_ONLY | SIMPLE_OPTIMIZATIONS | ADVANCED_OPTIMIZATIONS

## FIXME: Closure Compiler has no mode NONE. We simulate that by dumb file
## concatenation. However, that does of course not do any var substitutions.
#env['JS_COMPILATION_LEVEL'] = "NONE"
ab = env.JavaScript("build/autobahn.js", sources, JS_COMPILATION_LEVEL = "NONE")
#Depends(ab, 'version.txt')

#env['JS_COMPILATION_LEVEL'] = "SIMPLE_OPTIMIZATIONS"
ab_min = env.JavaScript("build/autobahn.min.js", sources, JS_COMPILATION_LEVEL = "SIMPLE_OPTIMIZATIONS")
ab_min_gz = env.GZip("build/autobahn.min.jgz", ab_min)
Depends(ab_min, 'version.txt')

## Autobahn for ExtJS
##
#sources_extjs = ["autobahnextjs/autobahnextjs.js"]
#ab_extjs = env.JavaScript("build/autobahnextjs.js", sources_extjs, JS_COMPILATION_LEVEL = "NONE")
#ab_extjs_min = env.JavaScript("build/autobahnextjs.min.js", sources_extjs, JS_COMPILATION_LEVEL = "SIMPLE_OPTIMIZATIONS")
#ab_extjs_min_gz = env.GZip("build/autobahnextjs.min.jgz", ab_extjs_min)

## List of generated artifacts
##
artifacts = [ab,
             ab_min,
             ab_min_gz,
             #ab_extjs,
             #ab_extjs_min,
             #ab_extjs_min_gz,
             ]

## Generate checksum files
##
checksums = []
checksums.append(env.MD5("build/CHECKSUM.MD5", artifacts))
checksums.append(env.SHA1("build/CHECKSUM.SHA1", artifacts))
checksums.append(env.SHA256("build/CHECKSUM.SHA256", artifacts))

## The default target consists of all artifacts that
## would get published
##
uploads = artifacts + checksums
Default(uploads)

## Upload to Amazon S3
##
env['S3_BUCKET'] = 'autobahn'
env['S3_BUCKET_PREFIX'] = 'js/' # note the trailing slash!
env['S3_OBJECT_ACL'] = 'public-read'

## The uploaded stuff is always considered stale
##
publish = AlwaysBuild(env.S3("build/.S3UploadDone", uploads))

Depends(publish, uploads)
Alias("publish", publish)
