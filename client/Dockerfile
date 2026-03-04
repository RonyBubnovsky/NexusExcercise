# Build stage – compile the React app
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

# Accept VITE_API_URL at build time (Render passes ENV vars as build args)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage – serve with a lightweight static server
FROM node:20-alpine

WORKDIR /app

# Install a simple static file server
RUN npm install -g serve

# Copy the built files from the build stage
COPY --from=build /app/dist ./dist

EXPOSE 5173

# Serve the built React app — uses $PORT if set (Render), else 5173
CMD ["sh", "-c", "serve -s dist -l ${PORT:-5173}"]
