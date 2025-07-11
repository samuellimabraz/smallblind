FROM node:22.13.1

# Install build tools for native modules
RUN apt-get update && apt-get install -y \
    libc6 \
    openssl \
    ca-certificates \
    build-essential \
    python3 \
    pkg-config \
    libssl-dev

# Create app directory
WORKDIR /usr/src/app

# Copy only package files and prisma directory first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (native modules will be built for the container)
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"] 