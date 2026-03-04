# Build stage
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the server
CMD ["node", "src/index.js"]
