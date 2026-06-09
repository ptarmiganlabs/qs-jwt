# Stage 1: Build
FROM node:24-bookworm-slim AS build

WORKDIR /nodeapp

# Install app dependencies
COPY package.json ./
RUN npm install --omit=dev

# Stage 2: Runtime
FROM node:24-bookworm-slim

# Add metadata about the image
LABEL maintainer="Göran Sander mountaindude@ptarmiganlabs.com"
LABEL description="Command line tool for creating JWTs that can be used to authenticate with both Qlik Sense Cloud and client-managed Qlik Sense (a.k.a Qlik Sense Enterprise on Windows, QSEoW)."

# Set environment to production
ENV NODE_ENV=production

WORKDIR /nodeapp

# Copy only necessary files from build stage
COPY --from=build --chown=node:node /nodeapp/node_modules ./node_modules
COPY --chown=node:node . .

# Use the built-in non-root user
USER node

ENTRYPOINT ["node", "qs-jwt.js"]
