FROM node:22-slim as dev 

WORKDIR /app

COPY package*.json ./

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --legacy-peer-deps


COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npm run dev"]


from node:22-slim as prod 

WORKDIR /app

copy package*.json ./

RUN npm ci 

COPY . . 

RUN npm run build 

EXPOSE 3000

CMD ["sh", "-c" , "npm run start"]
