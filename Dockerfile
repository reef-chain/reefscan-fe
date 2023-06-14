# Build Stage 1
# This build created a staging docker image
#
FROM node:fermium AS appbuild

WORKDIR /usr/src/app
COPY ./ ./
RUN yarn install
RUN yarn build

# Build Stage 2
# This creates static production server
#
FROM nginx:alpine

ARG GQL_WS_URI
ARG GQL_HTTP_URI
ARG NODE_WS
ARG VERIFICATOR_API
ARG UPLOAD_TOKEN_API
ARG NETWORK_ID
ARG NETWORK_LABEL

ENV GQL_WS_URI=$GQL_WS_URI
ENV GQL_HTTP_URI=$GQL_HTTP_URI
ENV NODE_WS=$NODE_WS
ENV VERIFICATOR_API=$VERIFICATOR_API
ENV UPLOAD_TOKEN_API=$UPLOAD_TOKEN_API
ENV NETWORK_ID=$NETWORK_ID
ENV NETWORK_LABEL=$NETWORK_LABEL

EXPOSE 443
EXPOSE 80

RUN apk update
RUN apk upgrade
RUN apk add bash
COPY --from=appbuild /usr/src/app/dist /usr/share/nginx/html
COPY ["replaceInDir.sh", "/docker-entrypoint.d/replaceInDir.sh"]
COPY ["nginx/default.conf", "/etc/nginx/conf.d/default.conf"]
RUN chmod +x /docker-entrypoint.d/replaceInDir.sh
