FROM node:20-alpine

WORKDIR /usr/src/app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Bundle app source
COPY . .

# Build Vue frontend
RUN npm run build

# Use pm2 to run app
RUN npm i -g pm2

ENV NODE_ENV=production

CMD pm2-runtime server.js
