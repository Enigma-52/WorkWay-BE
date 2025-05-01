# Use Node 20 as the base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Expose the port
EXPOSE 8080

# Run the compiled JavaScript
CMD ["node", "dist/server.js"]
