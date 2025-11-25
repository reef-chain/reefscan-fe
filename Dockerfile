FROM node:18 AS appbuild

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

RUN mv mainnet.config.js frontend.config.js

RUN yarn build     # creates .nuxt + serverMiddleware support


FROM node:18

WORKDIR /usr/src/app

COPY --from=appbuild /usr/src/app ./

ENV PORT=80
ENV HOST=0.0.0.0

EXPOSE 80
EXPOSE 443

CMD ["yarn", "start"]
