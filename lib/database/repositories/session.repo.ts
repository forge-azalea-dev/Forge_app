import { getDb, generateId, now } from "../db";
import type { Session, CreateSession, UpdateSession } from "../types";

async function requireSession(id: string): Promise<Session> {
  const session = await SessionRepo.getById(id);
  if (!session) throw new Error(`Session not found for id: ${id}`);
  return session;
}

export const SessionRepo = {
  async getAll(): Promise<Session[]> {
    const db = await getDb();
    return db.select<Session[]>("SELECT * FROM sessions ORDER BY started_at DESC");
  },

  async getByProject(projectId: string): Promise<Session[]> {
    const db = await getDb();
    return db.select<Session[]>(
      "SELECT * FROM sessions WHERE project_id = $1 ORDER BY started_at DESC",
      [projectId],
    );
  },

  async getById(id: string): Promise<Session | null> {
    const db = await getDb();
    const results = await db.select<Session[]>(
      "SELECT * FROM sessions WHERE id = $1",
      [id],
    );
    return results[0] ?? null;
  },

  async create(data: CreateSession): Promise<Session> {
    const db = await getDb();
    const id = generateId();
    const timestamp = now();

    await db.execute(
      `INSERT INTO sessions (id, project_id, title, summary, decisions, next_steps, duration, started_at, ended_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        data.project_id,
        data.title,
        data.summary,
        data.decisions,
        data.next_steps,
        data.duration,
        data.started_at,
        data.ended_at,
        timestamp,
      ],
    );

    return requireSession(id);
  },

  async update(id: string, data: UpdateSession): Promise<Session | null> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = { ...existing, ...data };

    await db.execute(
      `UPDATE sessions SET title=$1, summary=$2, decisions=$3, next_steps=$4, duration=$5, ended_at=$6
       WHERE id=$7`,
      [
        updated.title,
        updated.summary,
        updated.decisions,
        updated.next_steps,
        updated.duration,
        updated.ended_at,
        id,
      ],
    );

    return this.getById(id);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM sessions WHERE id = $1", [id]);
  },
};
