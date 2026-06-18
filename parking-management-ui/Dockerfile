FROM node:lts-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm install
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build
EXPOSE 3000
CMD ["npm", "start"]

