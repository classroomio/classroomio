# Use an official Node.js runtime as the base image
FROM node:18

# Install dependencies
RUN apt-get update && apt-get install -y \
  libgtk-3-0 \
  libnss3 \
  libasound2 \
  libxtst6 \
  libxss1 \
  libgbm1 \
  && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y xvfb

# Set the DISPLAY environment variable
ENV DISPLAY=:99



WORKDIR /usr/src/app/

COPY packages /usr/src/app/packages

COPY pnpm*.yaml /usr/src/app/

COPY apps/dashboard/ ./

RUN npm install -g pnpm

RUN pnpm install

RUN pnpm add -w @sveltejs/vite-plugin-svelte
RUN pnpm add -w sentry-vite-plugin
RUN pnpm add -w vite-plugin-electron
RUN pnpm add -w vite-plugin-electron-renderer
RUN pnpm add -w electron

# Build the application
RUN npm run build

# Make port 3000 available to the outside world
EXPOSE 3000
# Define the command that should be executed when the Docker container starts up
# CMD [ "npm", "start" ]
