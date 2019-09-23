FROM node:11-stretch

WORKDIR /opt/xbr-example
ADD package.json .
RUN npm install
ADD . .

ENTRYPOINT /bin/bash
