# Use Node 20 as the base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire project
COPY . .

# Run Prisma generate to create the Prisma client
RUN npx prisma generate

# Compile TypeScript to JavaScript
RUN npm run build

# Expose the port
EXPOSE 8080

# Start the server
CMD ["node", "dist/server.js"]
