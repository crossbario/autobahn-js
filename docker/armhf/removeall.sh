#!/bin/bash

docker rmi -f $(docker images -q crossbario/autobahn-js-armhf:* | uniq)
