FROM node:20-alpine
RUN apk add --no-cache openssl

# Render uses PORT=10000 by default
ENV PORT=10000
EXPOSE 10000

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .
RUN npm run build

CMD ["npm", "run", "docker-start"]
