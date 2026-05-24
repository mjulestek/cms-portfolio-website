FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

COPY package*.json ./

RUN npm ci --include=dev

COPY . .

RUN npm run build

RUN cp -r public .next/standalone/public
RUN mkdir -p .next/standalone/.next
RUN cp -r .next/static .next/standalone/.next/static

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]