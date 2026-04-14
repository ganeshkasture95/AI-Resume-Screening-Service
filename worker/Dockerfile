FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/worker ./worker
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/prompts ./prompts

CMD ["npm", "run", "worker:start"]
