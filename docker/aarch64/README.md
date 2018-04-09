# AutobahnJS for Docker

[![](https://images.microbadger.com/badges/version/crossbario/autobahn-js-aarch64.svg)](https://microbadger.com/images/crossbario/autobahn-js-aarch64 "Get your own version badge on microbadger.com")


Here you find the Dockerfiles for creating the [AutobahnJS for Docker images](https://hub.docker.com/r/crossbario/autobahn-js/) maintained by the Crossbar.io Project.

These images come with NodeJS and AutobahnJS preinstalled and are intended to base application service containers on.


https://hub.docker.com/r/armhf/node/


## Images

1. **`crossbario/autobahn-js:latest` == `crossbario/autobahnjs:alpine`: Alpine Linux based variant, the default (<27MB container size)** RECOMMENDED FOR GENERAL USE
2. `crossbario/autobahn-js:full`: Variant based on full Node image (650MB container size)

## Build, test and deploy

To build, test and deploy the AutobahnJS images to DockerHub, do:

```console
make build
make test
make publish
```

> You will need a Crossbar.io container running. Run `make crossbar` in the `crossbar` folder of this repo.
