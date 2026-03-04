# Build stage – compile the React app
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build

# Production stage – serve with a lightweight static server
FROM node:20-alpine

WORKDIR /app

# Install a simple static file server
RUN npm install -g serve

# Copy the built files from the build stage
COPY --from=build /app/dist ./dist

EXPOSE 5173

# Serve the built React app on port 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
