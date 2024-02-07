# Use an official Node.js runtime as the base image
FROM node:18

ARG SUPABASE_KEY 
ARG OPENAI_API_KEY
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG SMTP_PASSWORD
ARG SMTP_USER
ARG SMTP_HOST


ENV supabaseKey=$SUPABASE_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY
ENV SMTP_HOST=$SMTP_HOST
ENV SMTP_PORT=465
ENV SMTP_USER=$SMTP_USER
ENV SMTP_PASSWORD=$SMTP_PASSWORD
ENV SMTP_USER_HELP=$SMTP_USER
ENV SMTP_PASSWORD_HELP=$SMTP_PASSWORD
ENV UNSPLASH_API_KEY=$UNSPLASH_API_KEY
ENV PUBLIC_TINYMCE_API_KEY=$PUBLIC_TINYMCE_API_KEY
ENV PUBLIC_SERVER_URL=$PUBLIC_SERVER_URL
ENV PUBLIC_IP_REGISTRY_KEY=$PUBLIC_IP_REGISTRY_KEY

WORKDIR /usr/src/app/dashboard

COPY ../../packages /usr/src/app/dashboard/packages

COPY ../../pnpm*.yaml /usr/src/app/dashboard/

COPY ../../apps/dashboard/ ./

#RUN cp .env.example .env

RUN npm install -g npm@10.4.0

RUN npm install -g pnpm

RUN pnpm install

# Build the application
RUN npm run build

# Make port 3000 available to the outside world
EXPOSE 3000

# Define the command that should be executed when the Docker container starts up
CMD [ "npm", "start" ]

#TODO: the build is failing because of the $env, add this part to the readme and test again.
#TODO: I need to figure out why the dashboard triggers the classroomio-com build
