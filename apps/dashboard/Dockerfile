# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy everything from the current directory to the Docker container
COPY . .

# Navigate to the dashboard directory
WORKDIR /usr/src/app/dashboard

# Install pnpm globally
RUN npm install -g pnpm

# Install the application's dependencies inside the Docker container
RUN pnpm install

# Build the application
RUN npm run build

#TODO: the build is failing because of the $env, add this part to the readme and test again.
#TODO: I need to figure out why the dashboard triggers the classroomio-com build

# Make port 3000 available to the outside world
EXPOSE 3000

# Define the command that should be executed when the Docker container starts up
CMD [ "npm", "start" ]