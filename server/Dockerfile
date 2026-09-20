FROM node:22-alpine
RUN apk add --no-cache tzdata
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js auth.js ./
EXPOSE 3000
CMD ["node", "server.js"]
