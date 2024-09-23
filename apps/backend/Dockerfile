FROM node:slim AS app

RUN mkdir /app
WORKDIR /app

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
RUN npm install --frozen-lockfile
COPY . /app

ENV PORT 3002

EXPOSE 3002

CMD ["node", "server.js"]