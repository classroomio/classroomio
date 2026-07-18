export type PostgresErrorDetails = {
  code: string;
  constraint?: string;
  detail?: string;
  table?: string;
};

function readPostgresField(error: object, key: string): string | undefined {
  if (!(key in error)) {
    return undefined;
  }

  const value = (error as Record<string, unknown>)[key];

  return typeof value === 'string' ? value : undefined;
}

/**
 * Walks an error's `cause` chain and returns the first Postgres error payload
 * (postgres.js / Drizzle wrap the driver error as `cause`).
 */
export function getPostgresError(error: unknown): PostgresErrorDetails | null {
  let current: unknown = error;

  while (current && typeof current === 'object') {
    const code = readPostgresField(current, 'code');

    if (code && /^[0-9A-Z]{5}$/.test(code)) {
      return {
        code,
        constraint: readPostgresField(current, 'constraint_name'),
        detail: readPostgresField(current, 'detail'),
        table: readPostgresField(current, 'table_name')
      };
    }

    current = 'cause' in current ? (current as { cause: unknown }).cause : null;
  }

  return null;
}

export function isUniqueConstraintViolation(error: unknown): boolean {
  return getPostgresError(error)?.code === '23505';
}
