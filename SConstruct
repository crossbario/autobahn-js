###############################################################################
##
##  Copyright 2012 Tavendo GmbH
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
      java = '"' + os.path.join(env['JAVA_HOME'], 'bin', 'java') + '" '
      cmd = java + env.subst('-jar $JS_COMPILER --compilation_level $JS_COMPILATION_LEVEL');

      for define in env['JS_DEFINES'].keys():
         cmd += " --define=\"%s=%s\"" % (define, env['JS_DEFINES'][define])

      for file in source:
         cmd += " --js " + str(file)

      cmd += " --js_output_file " + str(target[0])
      os.system(cmd)


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

env['JS_DEFINES' ] = {}

sources = ["when/when.js", "autobahn/autobahn.js"]

# NONE | WHITESPACE_ONLY | SIMPLE_OPTIMIZATIONS | ADVANCED_OPTIMIZATIONS

#env['JS_COMPILATION_LEVEL'] = "NONE"
env.JavaScript("build/autobahn.js", sources, JS_COMPILATION_LEVEL = "NONE")

#env['JS_COMPILATION_LEVEL'] = "SIMPLE_OPTIMIZATIONS"
env.JavaScript("build/autobahn.min.js", sources, JS_COMPILATION_LEVEL = "SIMPLE_OPTIMIZATIONS")
