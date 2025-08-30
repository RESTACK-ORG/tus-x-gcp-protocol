# Use an official Node.js runtime as a parent image
FROM node:22-alpine

# Set the working directory to /server
WORKDIR /server

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose port 8080 (App Engine standard)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]