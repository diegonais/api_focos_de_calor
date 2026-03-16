FROM node:22-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache tzdata

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN yarn build

FROM node:22-alpine AS runner

WORKDIR /usr/src/app

RUN apk add --no-cache tzdata

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile --production

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
