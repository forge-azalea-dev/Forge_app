import Database from "@tauri-apps/plugin-sql";
import { SCHEMA_SQL } from "./schema";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const db = await Database.load("sqlite:forge.db");
  await initSchema(db);
  dbInstance = db;
  return db;
}

async function initSchema(db: Database): Promise<void> {
  const statements = SCHEMA_SQL.split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await db.execute(`${statement};`);
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}
