FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./

RUN npm install --include=dev

COPY . .

RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]