import pg from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

// Determine if we're using a Neon database URL
const isNeonDatabase = process.env.DATABASE_URL?.includes('.neon.tech');

// Configure Neon if needed
if (isNeonDatabase) {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create the appropriate pool based on the database URL
let pool;
let db;

if (isNeonDatabase) {
  // Use Neon's serverless pool for Neon databases
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
} else {
  // Use regular pg pool for local PostgreSQL
  pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
    // Add SSL configuration if needed
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
  });
  db = drizzlePg(pool, { schema });
}

export { pool, db };
