/**
 * Database Connection & Drizzle ORM Instance
 * 
 * Connects to PostgreSQL using the DATABASE_URL environment variable.
 * Exports the Drizzle db instance for use across the application.
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error(
    'FATAL: DATABASE_URL environment variable is not set.\n' +
    'Please configure it in your .env file:\n' +
    'DATABASE_URL="postgresql://user:password@localhost:5432/quickvet"'
  );
}

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout after 5s if unable to connect
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

// Create Drizzle ORM instance with schema for relational queries
export const db = drizzle(pool, { schema });

/**
 * Utility: Test the database connection on startup.
 * Returns true if connected successfully, false otherwise.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL database connected successfully.');
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err);
    return false;
  }
}

/**
 * Utility: Gracefully shut down the database pool.
 * Call this on server shutdown (SIGINT/SIGTERM).
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('Database pool closed.');
}
