import { getDb, generateId, now } from "../db";
import type { Prd } from "../types";

export const PrdRepo = {
  async getByProject(project_id: string): Promise<Prd | null> {
    const db = await getDb();
    const results = await db.select<Prd[]>(
      "SELECT * FROM prds WHERE project_id = $1 ORDER BY created_at ASC LIMIT 1",
      [project_id]
    );
    return results[0] ?? null;
  },

  async upsert(
    project_id: string,
    data: { title: string; content: string | null }
  ): Promise<Prd> {
    const existing = await this.getByProject(project_id);

    if (existing) {
      const db = await getDb();
      await db.execute(
        "UPDATE prds SET title=$1, content=$2, updated_at=$3 WHERE id=$4",
        [data.title, data.content, now(), existing.id]
      );
      return (await this.getByProject(project_id))!;
    }

    const db = await getDb();
    const id = generateId();
    const timestamp = now();
    await db.execute(
      `INSERT INTO prds (id, project_id, title, content, version, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, project_id, data.title, data.content, "1.0", timestamp, timestamp]
    );
    return (await this.getByProject(project_id))!;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM prds WHERE id = $1", [id]);
  },
};
