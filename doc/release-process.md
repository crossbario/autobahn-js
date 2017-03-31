# Releasing Autobahn|JS

Autobahn is released to the following locations:

1. On NPM, here https://www.npmjs.com/package/autobahn
2. On GitHub, here https://github.com/crossbario/autobahn-js-built

## Release Steps

### Test

Start a local Crossbar.io node with a default configuration (`crossbar init && crossbar start`). Then do

```
make test
```

### Bump version

Update `package.json` with the new release number.


### Build

In the root directory, do

```
make build
```

which will package the library for browser use into the `build` directory. For npm, there is nothing to build.


### Tag the release

E.g. by doing

```
git tag -a v0.9.7 -m "tagged release"
```

before you commit. (Add the hash of a commit at the end of the above to tag at a later time.)


### Publish

To publish:

```
make publish
```

Don't forget to tag and push from the AutobahnJSbuilt repo (which has been updated by above command).
