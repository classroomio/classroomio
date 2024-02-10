# Use an official Node.js runtime as the base image
FROM node:18

WORKDIR /usr/src/app/

COPY packages /usr/src/app/packages

COPY pnpm*.yaml /usr/src/app/

COPY apps/classroomio-com/ ./

RUN npm install -g pnpm

RUN pnpm install
RUN pnpm add -w @sveltejs/vite-plugin-svelte

# Set environment variables
#ENV STATIC_PUBLIC=/path/to/your/static/public

# Build the application
RUN npm run build

EXPOSE 5173

# Define the command that should be executed when the Docker container starts up
# CMD [ "npm", "dev" ]