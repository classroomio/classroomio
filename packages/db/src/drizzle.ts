import 'dotenv/config';

import * as schema from './schema';

import { SQL, sql } from 'drizzle-orm';

import { drizzle } from 'drizzle-orm/node-postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';

export const db = drizzle(connectionString, {
  schema
});

export * from 'drizzle-orm';
export * from './schema';

/**
 * Creates a SQL expression that returns the length of a JSON array column
 *
 * @param column The column containing the JSON array
 * @returns A SQL expression that can be used in where clauses
 */
function jsonArrayLength(column: any) {
  // Create a SQL expression using Drizzle's sql template literal
  const sqlExpression = sql`jsonb_array_length(${column})`;

  // Return an object with utility methods for comparison operations
  return {
    // Check if array length equals a specific value
    equals: (length: number): SQL<unknown> => {
      return sql`${sqlExpression} = ${length}`;
    },
    // Check if array length is greater than a specific value
    gt: (length: number): SQL<unknown> => {
      return sql`${sqlExpression} > ${length}`;
    },
    // Check if array length is less than a specific value
    lt: (length: number): SQL<unknown> => {
      return sql`${sqlExpression} < ${length}`;
    },
    // Check if array length is greater than or equal to a specific value
    gte: (length: number): SQL<unknown> => {
      return sql`${sqlExpression} >= ${length}`;
    },
    // Check if array length is less than or equal to a specific value
    lte: (length: number): SQL<unknown> => {
      return sql`${sqlExpression} <= ${length}`;
    }
  };
}

const explainAnalyze = async (d: typeof db, query: any) => {
  console.log(query.sql);
  const debugResult = await d.execute(sql`EXPLAIN ANALYZE ${query}`);
  console.debug(debugResult);
  return query;
};

export { explainAnalyze, jsonArrayLength };
