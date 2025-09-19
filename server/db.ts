import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import ws from "ws";

// Configure Neon for serverless with WebSocket support
neonConfig.fetchConnectionCache = true;
neonConfig.webSocketConstructor = ws;

// Create connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create Drizzle database instance
export const db = drizzle(pool, { schema });

export type Database = typeof db;