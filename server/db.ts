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
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('isNeonDatabase:', isNeonDatabase);

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
const pool = isNeonDatabase
  ? new NeonPool({ connectionString: process.env.DATABASE_URL })
  : new pg.Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
    });

const db = isNeonDatabase
  ? drizzle(pool as NeonPool, { schema })
  : drizzlePg(pool as pg.Pool, { schema });

export { pool, db };
