FROM node:slim AS app

# Add build arguments
ARG PUBLIC_SUPABASE_ANON_KEY
ARG PUBLIC_SUPABASE_URL
ARG CLOUDFLARE_BUCKET_DOMAIN
ARG CLOUDFLARE_ACCESS_KEY
ARG CLOUDFLARE_SECRET_ACCESS_KEY
ARG CLOUDFLARE_ACCOUNT_ID
ARG CLOUDFLARE_BUCKET_ID
ARG SMTP_HOST
ARG SMTP_USER
ARG SMTP_PASSWORD
ARG SMTP_PORT
ARG SMTP_SENDER
ARG ZOHO_TOKEN
ARG CLOUDFLARE_RENDERING_API_KEY
ARG OPENAPI_URL

RUN mkdir /app
WORKDIR /app

# Install pnpm and healthcheck tools
RUN npm install -g pnpm && \
    apt-get update && \
    apt-get install -y curl wget && \
    rm -rf /var/lib/apt/lists/*

# Install chrome stable from sources, then remove it. Why? The
# npm install of `puppeteer` brings its own bundle chromium build,
# and puppeteer releases are only guaranteed to work with that version.
#
# But the bundled chromium implicitly needs a bunch of shared libs on
# the host. It's a little tedious to find and maintain that list; but
# the official apt distro of `google-chrome-stable` should bring the right
# set along. So do that, but immediately uninstall (to free up layer space).
#
# This is a little brittle, since the puppeteer chrome could in theory diverge
# from the official apt chrome's shared lib deps. But it works..
# RUN apt-get update \
#   && apt-get install curl gnupg -y \
#   && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
#   && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
#   && apt-get update \
#   && apt-get install google-chrome-stable -y --no-install-recommends \
#   && apt-get remove google-chrome-stable -y \
#   && rm -rf /var/lib/apt/lists/*

# Add emoji fonts.
# Source: https://gist.github.com/win0err/9d8c7f0feabdfe8a4c9787b02c79ac51
# RUN mkdir ~/.fonts/ && \
#   wget https://github.com/samuelngs/apple-emoji-linux/releases/download/ios-15.4/AppleColorEmoji.ttf -O ~/.fonts/AppleColorEmoji.ttf

COPY ./package.json /app
RUN pnpm install
COPY . /app

# Set environment variables from build args
ENV NODE_ENV=production \
    PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY \
    PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL \
    CLOUDFLARE_BUCKET_DOMAIN=$CLOUDFLARE_BUCKET_DOMAIN \
    CLOUDFLARE_ACCESS_KEY=$CLOUDFLARE_ACCESS_KEY \
    CLOUDFLARE_SECRET_ACCESS_KEY=$CLOUDFLARE_SECRET_ACCESS_KEY \
    CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
    CLOUDFLARE_BUCKET_ID=$CLOUDFLARE_BUCKET_ID \
    CLOUDFLARE_RENDERING_API_KEY=$CLOUDFLARE_RENDERING_API_KEY \
    SMTP_HOST=$SMTP_HOST \
    SMTP_USER=$SMTP_USER \
    SMTP_PASSWORD=$SMTP_PASSWORD \
    SMTP_PORT=$SMTP_PORT \
    SMTP_SENDER=$SMTP_SENDER \
    ZOHO_TOKEN=$ZOHO_TOKEN \
    OPENAPI_URL=$OPENAPI_URL \
    PORT=3002

RUN pnpm build

EXPOSE 3002

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002 || exit 1

CMD ["pnpm", "start"]