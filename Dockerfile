# Use Node 20 as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Install ts-node globally
RUN npm install -g ts-node typescript

# Copy the rest of the application code
COPY . .

# Expose the port that the app will run on (you can adjust this based on your app)
EXPOSE 8080

# Command to run your TypeScript server using ts-node
CMD ["ts-node", "src/server.ts"]