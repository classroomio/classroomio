// Keep in sync with docker-compose.images.yaml (images, environment, healthchecks, volumes).

import * as Alchemy from 'alchemy';
import * as Output from 'alchemy/Output';
import * as RemovalPolicy from 'alchemy/RemovalPolicy';
import * as Docker from '@alchemy.run/docker';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';

const BUCKETS = { videos: 'videos', documents: 'documents', media: 'media' };
const POSTGRES_USER = 'postgres';
const POSTGRES_DB = 'classroomio';
const STORAGE_ACCESS_KEY_ID = 'classroomio';

const optional = (name: string) => Config.String(name).pipe(Config.withDefault(''));
const optionalSecret = (name: string) =>
  Config.Redacted(name).pipe(Config.withDefault(Redacted.make('')));

const STORAGE_SCRIPT = `
esc() { printf '%s' "$1" | sed -e 's/\\\\/\\\\\\\\/g' -e 's/"/\\\\"/g'; }
mkdir -p /etc/seaweedfs
cat > /etc/seaweedfs/s3.json <<EOF
{"identities":[{"name":"admin","credentials":[{"accessKey":"$(esc "$OBJECT_STORAGE_ACCESS_KEY_ID")","secretKey":"$(esc "$OBJECT_STORAGE_SECRET_ACCESS_KEY")"}],"actions":["Admin","Read","Write","List","Tagging"]},{"name":"anonymous","actions":["Read:$OBJECT_STORAGE_BUCKET_MEDIA"]}]}
EOF
/entrypoint.sh server -s3 -s3.port=9000 -s3.config=/etc/seaweedfs/s3.json -s3.allowedOrigins=* &
pid=$!
trap 'kill -TERM "$pid"' TERM INT
alive() { kill -0 "$pid" 2>/dev/null || { echo "storage: server exited during startup"; exit 1; }; }
until wget -q -O /dev/null http://127.0.0.1:9000/healthz; do alive; sleep 2; done
for bucket in "$OBJECT_STORAGE_BUCKET_VIDEOS" "$OBJECT_STORAGE_BUCKET_DOCUMENTS" "$OBJECT_STORAGE_BUCKET_MEDIA"; do
  until echo s3.bucket.list | weed shell -master=127.0.0.1:9333 2>/dev/null | grep -q "^[[:space:]]*$bucket[[:space:]]"; do
    alive
    echo "s3.bucket.create -name $bucket" | weed shell -master=127.0.0.1:9333 >/dev/null 2>&1
    sleep 2
  done
done
echo "storage: buckets ready"
wait "$pid"
`;

const caddyfile = (appDomain: string, storageDomain: string, acmeEmail: string) => `
${acmeEmail ? `{\n\temail ${acmeEmail}\n}\n` : ''}
${appDomain} {
\thandle /public-api/* {
\t\treverse_proxy api:3081
\t}
\thandle /${BUCKETS.media}/* {
\t\treverse_proxy storage:9000
\t}
\thandle {
\t\treverse_proxy dashboard:3082
\t}
}

${storageDomain} {
\treverse_proxy storage:9000
}
`;

const providers = Layer.merge(Docker.providers(), Alchemy.RandomProvider());
const state = Alchemy.localState();

export default Alchemy.Stack(
  'ClassroomIO',
  { providers, state },
  Effect.gen(function* () {
    const version = yield* Config.String('CIO_VERSION').pipe(Config.withDefault('latest'));
    const appDomain = yield* Config.String('APP_DOMAIN');
    const storageDomain = yield* Config.String('STORAGE_DOMAIN');
    const acmeEmail = yield* optional('ACME_EMAIL');
    const smtpHost = yield* optional('SMTP_HOST');
    const smtpPort = yield* optional('SMTP_PORT');
    const smtpUser = yield* optional('SMTP_USER');
    const smtpPassword = yield* optionalSecret('SMTP_PASSWORD');
    const smtpSender = yield* optional('SMTP_SENDER');
    const openAiApiKey = yield* optionalSecret('OPENAI_API_KEY');
    const licenseKey = yield* optionalSecret('LICENSE_KEY');
    const telemetryDisabled = yield* optional('CIO_TELEMETRY_DISABLED');

    const dashboardOrigin = `https://${appDomain}`;
    const storageOrigin = `https://${storageDomain}`;
    const caddyConfig = caddyfile(appDomain, storageDomain, acmeEmail);
    const smtp = {
      SMTP_HOST: smtpHost,
      SMTP_PORT: smtpPort,
      SMTP_USER: smtpUser,
      SMTP_PASSWORD: smtpPassword,
      SMTP_SENDER: smtpSender
    };

    const postgresPassword = yield* Alchemy.makeRandom('PostgresPassword', { bytes: 24 });
    const betterAuthSecret = yield* Alchemy.makeRandom('BetterAuthSecret', { bytes: 32 });
    const privateServerKey = yield* Alchemy.makeRandom('PrivateServerKey', { bytes: 32 });
    const storageSecretKey = yield* Alchemy.makeRandom('StorageSecretKey', { bytes: 24 });
    const databaseUrl = Output.map(postgresPassword, (password) =>
      Redacted.make(
        `postgresql://${POSTGRES_USER}:${Redacted.value(password)}@postgres:5432/${POSTGRES_DB}`
      )
    );

    const network = yield* Docker.Network('Network', { name: 'cio-network' });
    const postgresData = yield* Docker.Volume('PostgresData', { name: 'cio-postgres-data' }).pipe(
      RemovalPolicy.protect()
    );
    const redisData = yield* Docker.Volume('RedisData', { name: 'cio-redis-data' }).pipe(RemovalPolicy.protect());
    const storageData = yield* Docker.Volume('StorageData', { name: 'cio-storage-data' }).pipe(
      RemovalPolicy.protect()
    );
    const caddyData = yield* Docker.Volume('CaddyData', { name: 'cio-caddy-data' }).pipe(RemovalPolicy.protect());

    const postgresImage = yield* Docker.RemoteImage('PostgresImage', { name: 'postgres', tag: '16-alpine' });
    const redisImage = yield* Docker.RemoteImage('RedisImage', { name: 'redis', tag: '7-alpine' });
    const storageImage = yield* Docker.RemoteImage('StorageImage', { name: 'chrislusf/seaweedfs', tag: '4.48' });
    const apiImage = yield* Docker.RemoteImage('ApiImage', { name: 'classroomio/api', tag: version });
    const dashboardImage = yield* Docker.RemoteImage('DashboardImage', { name: 'classroomio/dashboard', tag: version });
    const jobsImage = yield* Docker.RemoteImage('JobsImage', { name: 'classroomio/jobs', tag: version });
    const caddyImage = yield* Docker.RemoteImage('CaddyImage', { name: 'caddy', tag: '2-alpine' });

    const on = (alias: string) => [{ name: network.name, aliases: [alias] }];

    const storageEnv = {
      OBJECT_STORAGE_ENDPOINT: 'http://storage:9000',
      OBJECT_STORAGE_PUBLIC_ENDPOINT: storageOrigin,
      OBJECT_STORAGE_ACCESS_KEY_ID: STORAGE_ACCESS_KEY_ID,
      OBJECT_STORAGE_SECRET_ACCESS_KEY: storageSecretKey,
      OBJECT_STORAGE_FORCE_PATH_STYLE: 'true',
      OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL: `${dashboardOrigin}/${BUCKETS.media}`,
      OBJECT_STORAGE_BUCKET_VIDEOS: BUCKETS.videos,
      OBJECT_STORAGE_BUCKET_DOCUMENTS: BUCKETS.documents,
      OBJECT_STORAGE_BUCKET_MEDIA: BUCKETS.media
    };

    yield* Docker.Container('Postgres', {
      name: 'cio-postgres',
      image: postgresImage,
      environment: { POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD: postgresPassword },
      volumes: [{ hostPath: postgresData.name, containerPath: '/var/lib/postgresql/data' }],
      networks: on('postgres'),
      healthcheck: {
        cmd: [
          'CMD-SHELL',
          `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} && psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -tAc 'SELECT 1'`
        ],
        interval: '5 seconds',
        timeout: '5 seconds',
        retries: 15,
        startPeriod: '10 seconds'
      },
      restart: 'unless-stopped',
      start: true
    });

    yield* Docker.Container('Redis', {
      name: 'cio-redis',
      image: redisImage,
      command: ['redis-server', '--appendonly', 'yes'],
      volumes: [{ hostPath: redisData.name, containerPath: '/data' }],
      networks: on('redis'),
      healthcheck: { cmd: ['CMD', 'redis-cli', 'ping'], interval: '5 seconds', timeout: '3 seconds', retries: 10 },
      restart: 'unless-stopped',
      start: true
    });

    yield* Docker.Container('Storage', {
      name: 'cio-storage',
      image: storageImage,
      entrypoint: '/bin/sh',
      command: ['-c', STORAGE_SCRIPT],
      environment: storageEnv,
      volumes: [{ hostPath: storageData.name, containerPath: '/data' }],
      networks: on('storage'),
      healthcheck: {
        cmd: ['CMD-SHELL', 'wget -q -O /dev/null http://127.0.0.1:9000/healthz'],
        interval: '5 seconds',
        timeout: '5 seconds',
        retries: 20,
        startPeriod: '10 seconds'
      },
      restart: 'unless-stopped',
      start: true
    });

    yield* Docker.Container('Api', {
      name: 'cio-api',
      image: apiImage,
      environment: {
        NODE_ENV: 'production',
        PORT: '3081',
        PUBLIC_SERVER_URL: 'http://localhost:3081',
        GOOGLE_CLIENT_ID: 'docker-local-client-id',
        GOOGLE_CLIENT_SECRET: 'docker-local-client-secret',
        DATABASE_URL: databaseUrl,
        REDIS_URL: 'redis://redis:6379',
        PUBLIC_IS_SELFHOSTED: 'true',
        DASHBOARD_ORIGIN: dashboardOrigin,
        BETTER_AUTH_SECRET: betterAuthSecret,
        PRIVATE_SERVER_KEY: privateServerKey,
        WEBHOOK_ALLOW_PRIVATE_NETWORKS: 'false',
        OPENAI_API_KEY: openAiApiKey,
        LICENSE_KEY: licenseKey,
        ...smtp,
        ...storageEnv
      },
      networks: on('api'),
      healthcheck: {
        cmd: [
          'CMD',
          'node',
          '-e',
          "fetch('http://localhost:3081/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
        ],
        interval: '10 seconds',
        timeout: '5 seconds',
        retries: 12,
        startPeriod: '30 seconds'
      },
      restart: 'unless-stopped',
      start: true
    });

    yield* Docker.Container('Dashboard', {
      name: 'cio-dashboard',
      image: dashboardImage,
      environment: {
        NODE_ENV: 'production',
        PORT: '3082',
        ORIGIN: dashboardOrigin,
        PUBLIC_IS_SELFHOSTED: 'true',
        PRIVATE_SERVER_URL: 'http://api:3081',
        PRIVATE_SERVER_KEY: privateServerKey,
        PRIVATE_APP_HOST: 'localhost',
        PRIVATE_APP_SUBDOMAINS: 'app',
        CSP_CONNECT_SRC_DOMAINS: storageOrigin,
        CSP_MEDIA_SRC_DOMAINS: storageOrigin
      },
      networks: on('dashboard'),
      restart: 'unless-stopped',
      start: true
    });

    yield* Docker.Container('Jobs', {
      name: 'cio-jobs',
      image: jobsImage,
      environment: {
        NODE_ENV: 'production',
        DATABASE_URL: databaseUrl,
        REDIS_URL: 'redis://redis:6379',
        PUBLIC_IS_SELFHOSTED: 'true',
        PRIVATE_SERVER_KEY: privateServerKey,
        WEBHOOK_ALLOW_PRIVATE_NETWORKS: 'false',
        CIO_DEPLOYMENT_METHOD: 'alchemy',
        CIO_TELEMETRY_DISABLED: telemetryDisabled,
        OPENAI_API_KEY: openAiApiKey,
        LICENSE_KEY: licenseKey,
        ...smtp,
        ...storageEnv
      },
      networks: on('jobs'),
      restart: 'unless-stopped',
      start: true
    });

    yield* Docker.Container('Caddy', {
      name: 'cio-caddy',
      image: caddyImage,
      entrypoint: '/bin/sh',
      command: [
        '-c',
        'printf "%s\\n" "$CADDYFILE" > /etc/caddy/Caddyfile && exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile'
      ],
      environment: { CADDYFILE: caddyConfig },
      ports: [
        { external: 80, internal: 80 },
        { external: 443, internal: 443 },
        { external: 443, internal: 443, protocol: 'udp' }
      ],
      volumes: [{ hostPath: caddyData.name, containerPath: '/data' }],
      networks: on('caddy'),
      restart: 'unless-stopped',
      start: true
    });

    return { dashboard: dashboardOrigin, storage: storageOrigin };
  })
);
