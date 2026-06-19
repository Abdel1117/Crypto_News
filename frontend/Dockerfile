FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --legacy-peer-deps


COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npm install --legacy-peer-deps && npm run dev"]