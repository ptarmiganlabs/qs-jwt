# Build Docker image
FROM node:19-bullseye-slim

# Add metadata about the image
LABEL maintainer="Göran Sander mountaindude@ptarmiganlabs.com"
LABEL description="Command line tool for creating JWTs that can be used to authenticate with both Qlik Sense Cloud and client-managed Qlik Sense (a.k.a Qlik Sense Enterprise on Windows, QSEoW)."

# Create app dir inside container
WORKDIR /nodeapp

# Install app dependencies separately (creating a separate layer for node_modules, effectively caching them between image rebuilds)
COPY package.json .
RUN npm install

# Copy app's source files
COPY . .

# Create and use non-root user 
RUN groupadd -r nodejs \
   && useradd -m -r -g nodejs nodejs

RUN chown -R nodejs:nodejs /nodeapp
RUN chmod 755 /nodeapp

USER nodejs

ENTRYPOINT ["node", "qs-jwt.js"]

