FROM node:18

WORKDIR "/app"

RUN npm install -g pnpm

COPY ./package.json ./
COPY ./pnpm-lock.yaml ./

RUN pnpm i --frozen-lockfile

COPY . /app/

WORKDIR "/app/apps/dashboard"

RUN pnpm i --frozen-lockfile
RUN pnpm prepare
RUN pnpm build

EXPOSE 5000

CMD ["pnpm", "start"]
# CMD [ "sh", "-c", "ls -la && cd apps/dashboard && pnpm build && pnpm start" ]
