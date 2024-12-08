# Use a Node.js base image
FROM node:20-alpine

# Install additional packages
RUN apk add --no-cache bash git yq

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Set the command to start the server
CMD ["node", "dist/server.js"]