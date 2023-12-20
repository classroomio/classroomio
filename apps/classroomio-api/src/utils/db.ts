import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const dbURL = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(dbURL, { prepare: false });
const db = drizzle(client);

export default db;
