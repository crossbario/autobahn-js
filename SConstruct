import os
import json
import pkg_resources

taschenmesser = pkg_resources.resource_filename('taschenmesser', '..')
#taschenmesser = "../../infrequent/taschenmesser"
ENV=os.environ

ENV['JS_COMPILER'] = '/usr/local/lib/node_modules/google-closure-compiler/compiler.jar'

env = Environment(tools = ['default', 'taschenmesser'],
                  toolpath = [taschenmesser],
                  ENV = ENV)

# Get package version
version = json.load(open('package.json'))['version']
print("Building AutobahnJS {}".format(version))

env['JS_DEFINES'] = {
#   'AUTOBAHNJS_VERSION': "'%s'" % version
}

# Source for Autobahn package
sourcedir = 'lib'
sources = [os.path.join(sourcedir, d) for d in os.listdir(sourcedir)]

# browserified
ab = env.Command("build/autobahn.js",
                 "lib/autobahn.js",
                 "./node_modules/browserify/bin/cmd.js $SOURCE --ignore-missing --standalone autobahn -o $TARGET")
Depends(ab, sources)

# minimized (with Google Closure)
ab_min = env.JavaScript("build/autobahn.min.js",
                        ab,
                        #JS_COMPILATION_LEVEL = "ADVANCED_OPTIMIZATIONS")
                        JS_COMPILATION_LEVEL = "SIMPLE_OPTIMIZATIONS")

# minimized & compressed
ab_min_gz = env.GZip("build/autobahn.min.jgz",
                     ab_min)


# list of generated artifacts
artifacts = [ab,
             ab_min,
             ab_min_gz]

# generate checksum files
checksums = []
checksums.append(env.MD5("build/CHECKSUM.MD5", artifacts))
checksums.append(env.SHA1("build/CHECKSUM.SHA1", artifacts))
checksums.append(env.SHA256("build/CHECKSUM.SHA256", artifacts))

# fixed static files to be included
statics = []
for f in ["LICENSE"]:
    statics.append(Command("build/{}".format(f), [], Copy("$TARGET", f)))

# The default target consists of all artifacts that
# would get published
uploads = artifacts + checksums + statics
Default(uploads)
#Default(ab)

# Upload to Amazon S3
env['S3_BUCKET'] = 'autobahn'
env['S3_OBJECT_ACL'] = 'public-read'

published = []

for s in ['latest', version]:
    e = env.Clone(S3_BUCKET_PREFIX = 'autobahnjs/{}/'.format(s)) # note the trailing slash!
    published.append(AlwaysBuild(e.S3("build/.S3UploadDone_{}".format(s), uploads)))


# The uploaded stuff is always considered stale
Depends(published, uploads)

Alias("publish", published)
