import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'url';
import path from 'path';

export async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }

  const pool = new Pool({
    connectionString,
    max: 1,
  });

  const db = drizzle(pool);
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  console.log(`[Migration] Applying migrations from ${migrationsFolder}...`);

  try {
    await migrate(db, { migrationsFolder });
    console.log('[Migration] Migrations applied successfully.');
  } catch (error) {
    console.error('[Migration] Migration execution failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (
  executedFilePath &&
  (currentFilePath === executedFilePath ||
    executedFilePath.endsWith('migrate.js') ||
    executedFilePath.endsWith('migrate.ts'))
) {
  runMigrations()
    .then(() => {
      console.log('[Migration] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Fatal error during migration:', err);
      process.exit(1);
    });
}
