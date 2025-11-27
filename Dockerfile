FROM node:18

WORKDIR /usr/src/app

# Install dependencies first
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install

# Copy full source
COPY . .

# Add entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port
ENV PORT=80
ENV HOST=0.0.0.0
EXPOSE 80
EXPOSE 443

ENTRYPOINT ["/entrypoint.sh"]
