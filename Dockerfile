FROM node:18 AS appbuild

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./
RUN yarn install

COPY . .

# Accept build variables
ARG GQL_WS_URI
ARG GQL_HTTP_URI
ARG NODE_WS
ARG VERIFICATOR_API
ARG UPLOAD_TOKEN_API
ARG NETWORK_ID
ARG NETWORK_LABEL
ARG SOLIDITY_SCAN_API

# Convert ARG → ENV
ENV GQL_WS_URI=$GQL_WS_URI
ENV GQL_HTTP_URI=$GQL_HTTP_URI
ENV NODE_WS=$NODE_WS
ENV VERIFICATOR_API=$VERIFICATOR_API
ENV UPLOAD_TOKEN_API=$UPLOAD_TOKEN_API
ENV NETWORK_ID=$NETWORK_ID
ENV NETWORK_LABEL=$NETWORK_LABEL
ENV SOLIDITY_SCAN_API=$SOLIDITY_SCAN_API

# Replace placeholders BEFORE building
RUN sed -i "s|&NETWORK_ID|${NETWORK_ID}|g" frontend.config.js && \
    sed -i "s|&NETWORK_LABEL|${NETWORK_LABEL}|g" frontend.config.js && \
    sed -i "s|&NODE_WS|${NODE_WS}|g" frontend.config.js && \
    sed -i "s|&GQL_WS_URI|${GQL_WS_URI}|g" frontend.config.js && \
    sed -i "s|&GQL_HTTP_URI|${GQL_HTTP_URI}|g" frontend.config.js && \
    sed -i "s|&VERIFICATOR_API|${VERIFICATOR_API}|g" frontend.config.js && \
    sed -i "s|&UPLOAD_TOKEN_API|${UPLOAD_TOKEN_API}|g" frontend.config.js && \
    sed -i "s|&SOLIDITY_SCAN_API|${SOLIDITY_SCAN_API}|g" frontend.config.js

# Now build Nuxt with correct values
RUN yarn build


# -------------------------
# Runtime container
# -------------------------
FROM node:18

WORKDIR /usr/src/app

COPY --from=appbuild /usr/src/app ./

ENV PORT=80
ENV HOST=0.0.0.0
EXPOSE 80

CMD ["yarn", "start"]
