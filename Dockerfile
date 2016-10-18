FROM node:6.8
MAINTAINER Gildas Cherruel <gildas.cherruel@inin.com>

ENV NODE_ENV=development
WORKDIR /usr/local/src

COPY package.json /usr/local/src/package.json
COPY bower.json   /usr/local/src/bower.json
RUN npm install

COPY config.json /usr/local/src/config.json

COPY app    /usr/local/src/app
COPY public /usr/local/src/public
COPY routes /usr/local/src/routes
COPY views  /usr/local/src/views
COPY test   /usr/local/src/test

RUN npm --version

EXPOSE 3000
CMD [ "npm", "start" ]
