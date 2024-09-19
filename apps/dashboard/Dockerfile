FROM node:18

WORKDIR "/app"

RUN npm install -g pnpm

COPY ./package.json ./
COPY ./pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . /app/

CMD [ "ls", "-la" ]
CMD [ "cd", "apps/dashboard" ]
CMD [ "pnpm", "build" ]

EXPOSE 5000

CMD [ "pnpm", "start" ]
