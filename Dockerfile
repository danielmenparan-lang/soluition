FROM node:20-alpine AS build
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json* ./
COPY extensions ./extensions
RUN npm ci

COPY . .
RUN npm run build
RUN npx prisma generate
RUN npm prune --omit=dev

FROM node:20-alpine
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NODE_OPTIONS=--max-old-space-size=384

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

# Render sets PORT at runtime — react-router-serve reads process.env.PORT
EXPOSE 10000

CMD ["node", "./node_modules/@react-router/serve/dist/cli.js", "./build/server/index.js"]
