# Use an official Node.js runtime as the base image
FROM node:18

WORKDIR /usr/src/app/

# Copy package.json and package-lock.json to the working directory
COPY apps/docs/ ./
# Install the application dependencies


RUN npm install

# Copy the rest of the application code to the working directory


# Build the application
RUN npm run build

# Expose port 3000 for the application
EXPOSE 3000

# Define the command to run the application
# CMD [ "npm", "start" ]