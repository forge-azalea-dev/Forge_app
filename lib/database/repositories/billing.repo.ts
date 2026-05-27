import { getDb, generateId, now } from "../db";
import type { Billing, CreateBilling, UpdateBilling } from "../types";
import type { BillingStatus } from "../schema";

async function requireBilling(id: string): Promise<Billing> {
  const billing = await BillingRepo.getById(id);
  if (!billing) throw new Error(`Billing not found for id: ${id}`);
  return billing;
}

export const BillingRepo = {
  async getAll(): Promise<Billing[]> {
    const db = await getDb();
    return db.select<Billing[]>("SELECT * FROM billing ORDER BY billing_date ASC");
  },

  async getById(id: string): Promise<Billing | null> {
    const db = await getDb();
    const results = await db.select<Billing[]>(
      "SELECT * FROM billing WHERE id = $1",
      [id],
    );
    return results[0] ?? null;
  },

  async search(query: string): Promise<Billing[]> {
    const db = await getDb();
    return db.select<Billing[]>(
      "SELECT * FROM billing WHERE name LIKE $1 OR description LIKE $1 ORDER BY billing_date ASC",
      [`%${query}%`],
    );
  },

  async filterByStatus(status: BillingStatus): Promise<Billing[]> {
    const db = await getDb();
    return db.select<Billing[]>(
      "SELECT * FROM billing WHERE status = $1 ORDER BY billing_date ASC",
      [status],
    );
  },

  async create(data: CreateBilling): Promise<Billing> {
    const db = await getDb();
    const id = generateId();
    const timestamp = now();

    await db.execute(
      `INSERT INTO billing (id, name, description, amount, currency, cycle, billing_date, next_billing, status, category, url, notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        id,
        data.name,
        data.description,
        data.amount,
        data.currency,
        data.cycle,
        data.billing_date,
        data.next_billing,
        data.status,
        data.category,
        data.url,
        data.notes,
        timestamp,
        timestamp,
      ],
    );

    return requireBilling(id);
  },

  async update(id: string, data: UpdateBilling): Promise<Billing | null> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = { ...existing, ...data, updated_at: now() };

    await db.execute(
      `UPDATE billing SET name=$1, description=$2, amount=$3, currency=$4, cycle=$5,
       billing_date=$6, next_billing=$7, status=$8, category=$9, url=$10, notes=$11, updated_at=$12
       WHERE id=$13`,
      [
        updated.name,
        updated.description,
        updated.amount,
        updated.currency,
        updated.cycle,
        updated.billing_date,
        updated.next_billing,
        updated.status,
        updated.category,
        updated.url,
        updated.notes,
        updated.updated_at,
        id,
      ],
    );

    return this.getById(id);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM billing WHERE id = $1", [id]);
  },
};
