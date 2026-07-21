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

ENV PORT=10000
ENV HOST=0.0.0.0
EXPOSE 10000
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY extensions ./extensions
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts

CMD ["npm", "run", "docker-start"]
