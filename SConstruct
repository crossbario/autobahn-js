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

import os, sys
import subprocess
from SCons.Errors import *


def js_builder(target, source, env):

   if env['JS_COMPILATION_LEVEL'] == 'NONE':
      outfile = str(target[0])
      of = open(outfile, 'w')
      for file in source:
         of.write(open(str(file)).read())
         of.write("\n")
      of.close()

   else:
      cmd = []
      cmd.append(os.path.join(env['JAVA_HOME'], 'bin', 'java'))

      cmd.extend(['-jar', env['JS_COMPILER']])

      for define in env['JS_DEFINES']:
         cmd.append('--define="%s=%s"' % (define, env['JS_DEFINES'][define]))

      for file in source:
         cmd.extend(["--js", str(file)])

      cmd.extend(["--js_output_file", str(target[0])])

      #cmd.append("--warning_level=VERBOSE")
      #cmd.append("--jscomp_warning=missingProperties")
      #cmd.append("--jscomp_warning=checkTypes")

      print ' '.join(cmd)
      subprocess.call(cmd)


env = Environment()
env.Append(BUILDERS = {'JavaScript': Builder(action = js_builder)})

if os.environ.has_key('JAVA_HOME'):
   env['JAVA_HOME'] = os.environ['JAVA_HOME']
else:
   raise SCons.Errors.UserError, "Need to have a Java Run-time - please set JAVA_HOME ennvironment variable."

if os.environ.has_key('JS_COMPILER'):
   env['JS_COMPILER'] = os.environ['JS_COMPILER']
else:
   raise SCons.Errors.UserError, "Need path to Google Closure Compiler JAR (compiler.jar) in JS_COMPILER environment variable."

env['JS_DEFINES' ] = {
   'AUTOBAHNJS_VERSION': "'%s'" % open('version.txt').read().strip(),
   'AUTOBAHNJS_DEBUG': "false"
}

sources = ["autobahn/license.js",
           "when/when.js",
           "cryptojs/components/core.js",
           "cryptojs/components/enc-base64.js",
           "cryptojs/components/hmac.js",
           "cryptojs/components/sha256.js",
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
Depends(ab_min, 'version.txt')

## Autobahn for ExtJS
##
sources_extjs = ["autobahnextjs/autobahnextjs.js"]
ab_extjs = env.JavaScript("build/autobahnextjs.js", sources_extjs, JS_COMPILATION_LEVEL = "NONE")
ab_extjs_min = env.JavaScript("build/autobahnextjs.min.js", sources_extjs, JS_COMPILATION_LEVEL = "SIMPLE_OPTIMIZATIONS")
