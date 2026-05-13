import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const url = process.env.DATABASE_URL!
const isNeon = url.includes('neon.tech')

const pool = new Pool({
  connectionString: url,
  ssl: isNeon ? { rejectUnauthorized: false } : false,
})

export const db = drizzle(pool, { schema })
export type DB = typeof db
