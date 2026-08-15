import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_URL || path.join(dataDir, 'waitwise.db');

export const db = new DatabaseSync(dbPath);

// Enable foreign key constraints
db.exec('PRAGMA foreign_keys = ON;');

const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

type SupportedParam = string | number | boolean | null | undefined | bigint;

function sanitizeParams(params: SupportedParam[]): (string | number | bigint | null)[] {
  return params.map((p) => {
    if (typeof p === 'boolean') return p ? 1 : 0;
    if (p === undefined) return null;
    return p;
  });
}

/**
 * Type-safe query helpers
 */
export function queryAll<T = any>(sql: string, params: SupportedParam[] = []): T[] {
  const cleanParams = sanitizeParams(params);
  const stmt = db.prepare(sql);
  return stmt.all(...cleanParams) as T[];
}

export function queryOne<T = any>(sql: string, params: SupportedParam[] = []): T | undefined {
  const cleanParams = sanitizeParams(params);
  const stmt = db.prepare(sql);
  const rows = stmt.all(...cleanParams);
  return (rows[0] as T) || undefined;
}

export function execute(sql: string, params: SupportedParam[] = []) {
  const cleanParams = sanitizeParams(params);
  const stmt = db.prepare(sql);
  return stmt.run(...cleanParams);
}

export default db;
