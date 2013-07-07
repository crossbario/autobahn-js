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

import os, sys, hashlib, gzip
import subprocess
from SCons.Errors import *

try:
   from boto.s3.connection import S3Connection
   from boto.s3.key import Key
   hasBoto = True
except:
   print "Boto missing. Upload to Amazon S3 won't be available."
   hasBoto = False



def js_builder(target, source, env):
   """
   SCons builder for Google Closure.
   """
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


def gzipper(target, source, env):
   if len(source) > 1:
      raise Exception("cannot GZip multiple files")
   f_in = open(source[0].path, 'rb')
   f_out = gzip.open(target[0].path, 'wb')
   f_out.writelines(f_in)
   f_out.close()
   f_in.close()


def checksumsMD5(target, source, env):
   """
   SCons builder for computing a fingerprint file for artifacts.
   """
   checksums = {}
   for s in source:
      key = Key(s.name)
      md5 = key.compute_md5(open(s.path, "rb"))[0]
      checksums[s.name] = md5

   ## MD5 (autobahn.js) = d1ff7ad2c5c4cf0d652566cbc78476ea
   ##
   checksumsString = ''.join(["MD5 (%s) = %s\n" % c for c in checksums.items()])

   f = open(target[0].path, 'wb')
   f.write(checksumsString)
   f.close()


def s3_uploader(target, source, env):
   """
   SCons builder for Amazon S3 upload.
   """
   ## S3 connection and bucket to upload to
   ##
   s3 = S3Connection()
   bucket = s3.get_bucket("autobahn")

   ## compute MD5s of artifacts to upload
   ##
   checksums = {}
   for s in source:
      key = Key(s.name)
      md5 = key.compute_md5(open(s.path, "rb"))[0]
      checksums[s.name] = md5

   ## determine stuff we need to upload
   ##
   uploads = []
   for s in source:
      key = bucket.lookup("js/%s" % s.name)
      if not key or key.etag.replace('"', '') != checksums[s.name]:
         uploads.append(s)
      else:
         print "%s unchanged versus S3" % s.name

   ## actually upload new or changed stuff
   ##
   for u in uploads:
      print "Uploading %s to S3 .." % u.name
      key = Key(bucket, "js/%s" % u.name)
      ##
      ## Do special stuff for "*.jgz". Note that "set_metadata"
      ## must be set before uploading!
      ##
      if os.path.splitext(u.name)[1].lower() == ".jgz":
         ## override default chosen by S3 ..
         key.set_metadata('Content-Type', 'application/x-javascript')
         key.set_metadata('Content-Encoding', 'gzip')
      key.set_contents_from_filename(u.path)
      key.set_acl('public-read')

   ## revisit uploaded stuff and get MD5s
   ##
   checksumsS3 = {}
   for s in source:
      key = bucket.lookup("js/%s" % s.name)
      md5 = key.etag.replace('"', '')
      checksumsS3[s.name] = md5
   checksumsS3String = ''.join(["MD5 (%s) = %s\n" % c for c in checksumsS3.items()])

   ## target produced is checksums as they exist on S3
   ##
   f = open(target[0].path, "wb")
   f.write(checksumsS3String)
   f.close()


env = Environment()
env.Append(BUILDERS = {'JavaScript': Builder(action = js_builder),
                       'GZip': Builder(action = gzipper),
                       'MD5': Builder(action = checksumsMD5),
                       'S3': Builder(action = s3_uploader)})

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

## Generate MD5 checksums file
##
checksums = env.MD5("build/CHECKSUM.MD5", artifacts)
uploads = artifacts + [checksums]

Default(uploads)

## Upload to Amazon S3
##
if hasBoto:
   publish = env.S3("build/.S3UploadDone", uploads)
   Depends(publish, uploads)
   Alias("publish", publish)
