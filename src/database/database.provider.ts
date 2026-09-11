import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

export const DATABASE = 'DATABASE';

export type DrizzleDB = NodePgDatabase<typeof schema>;

export const databaseProvider: Provider = {
  provide: DATABASE,
  useFactory: (): DrizzleDB => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }

    const pool = new Pool({
      connectionString,
      max: Number(process.env.DB_POOL_MAX ?? 20),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });

    return drizzle(pool, { schema });
  },
};
