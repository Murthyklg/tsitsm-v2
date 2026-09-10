import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { getPool } from './db.js';

const schema = await readFile(new URL('../database/001_initial_schema.sql', import.meta.url), 'utf8');
const pool = await getPool();
await pool.request().batch(schema);
console.log('SQL Server schema applied.');
await pool.close();
