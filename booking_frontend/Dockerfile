ARG NODE_VERSION=lts-trixie-slim

# Use a lightweight Node.js image for building (customizable via ARG)
FROM node:${NODE_VERSION} AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package-related files first to leverage Docker's caching mechanism
COPY ./package.json ./package-lock.json ./

# Install project dependencies using npm ci (ensures a clean, reproducible install)
RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps

# Copy the rest of the application source code into the container
COPY . .

# Build the Angular application
RUN npm run build 