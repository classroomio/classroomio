const PGBOUNCER_PORT = '6432';
const POSTGRES_PORT = '5432';

/**
 * Connection string for drizzle-kit migrate and db:setup.
 * Prefers DIRECT_DATABASE_URL; otherwise rewrites PlanetScale PgBouncer `:6432` to Postgres `:5432`.
 */
export function resolveMigratorDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.DIRECT_DATABASE_URL) {
    return env.DIRECT_DATABASE_URL;
  }

  const pooledUrl = env.DATABASE_URL ?? env.PRIVATE_DATABASE_URL ?? '';

  return rewritePgbouncerPortToPostgres(pooledUrl);
}

export function rewritePgbouncerPortToPostgres(connectionString: string): string {
  try {
    const parsed = new URL(connectionString);

    if (parsed.port === PGBOUNCER_PORT) {
      parsed.port = POSTGRES_PORT;
    }

    return parsed.toString();
  } catch {
    return connectionString;
  }
}
