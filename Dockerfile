FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY uploads ./uploads

ENV NODE_ENV=production
EXPOSE 5000
CMD ["tsx", "src/server.ts"]
