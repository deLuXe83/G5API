FROM node:16-alpine

RUN apk add gettext

# clone and move into Get5API folder
WORKDIR /Get5API
COPY package*.json .
COPY yarn.lock .
RUN yarn

COPY . .

# set config with env variables, build, and run application
CMD envsubst < /Get5API/config/production.json.template > /Get5API/config/production.json  && \
    yarn migrate-create-prod && \
    yarn migrate-prod-upgrade && \
    node ./bin/www
