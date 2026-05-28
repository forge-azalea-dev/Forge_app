import Database from "@tauri-apps/plugin-sql";
import { SCHEMA_SQL } from "./schema";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const db = await Database.load("sqlite:forge.db");
  await db.execute("PRAGMA foreign_keys = ON;");
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

export async function seedInitialData(): Promise<void> {
  const db = await getDb();
  const existing = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM billing"
  );
  if (!existing[0] || existing[0].count > 0) return;

  const { BillingRepo } = await import("./repositories/billing.repo");
  await BillingRepo.create({
    name: "Claude Pro",
    description: "Anthropic Claude AI - Pro Plan",
    amount: 20,
    currency: "USD",
    cycle: "monthly",
    billing_date: 1,
    next_billing: null,
    status: "active",
    category: "AI Tools",
    url: "https://claude.ai",
    notes: null,
  });
}
