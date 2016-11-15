# Releasing Autobahn|JS

## Release Steps

Autobahn is release to the following locations:

1. On S3, here https://autobahn.s3.amazonaws.com/autobahnjs/latest/autobahn.min.jgz
2. On NPM, here https://www.npmjs.com/package/autobahn
3. On GitHub, here https://github.com/crossbario/autobahn-js-built

### Update the release number in the repo

Update 'package/package.json' with the new release number.


### Build for browsers

In the root directory, do

```
make all
```

which will package the library for browser use into the `build` directory.


### Tag the release

E.g. by doing

```
git tag -a v0.9.7 -m "tagged release"
```

before you commit. (Add the hash of a commit at the end of the above to tag at a later time.)


### Draft a release on GitHub

If your comment for the tagging did not include "tagged release", then you need to manually draft a release. Go to 'releases' and 'Draft a new release' (adding some release notes is nice!).

Otherwise: add release notes to the automatically created release.


### Publish to npm

In the `package` directory do

```
make publish
```

(This requires your npm user to have publishing privileges for the package on npm.)


### Copy over to AutobahnJSbuilt

Just copy over the contents of the `build` directory to the AutobahnJSbuilt repo, tag and commit.


### Upload to S3

Do

```
scons publish
```

to upload the built version to S3.
