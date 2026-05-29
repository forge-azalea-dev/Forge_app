import { getDb, generateId, now } from "../db";
import type { Todo, CreateTodo, UpdateTodo } from "../types";

async function requireTodo(id: string): Promise<Todo> {
  const todo = await TodoRepo.getById(id);
  if (!todo) throw new Error(`Todo not found for id: ${id}`);
  return todo;
}

export const TodoRepo = {
  async getByProject(project_id: string): Promise<Todo[]> {
    const db = await getDb();
    return db.select<Todo[]>(
      "SELECT * FROM todos WHERE project_id = $1 ORDER BY created_at ASC",
      [project_id],
    );
  },

  async getById(id: string): Promise<Todo | null> {
    const db = await getDb();
    const results = await db.select<Todo[]>(
      "SELECT * FROM todos WHERE id = $1",
      [id],
    );
    return results[0] ?? null;
  },

  async create(data: CreateTodo): Promise<Todo> {
    const db = await getDb();
    const id = generateId();
    const timestamp = now();

    await db.execute(
      `INSERT INTO todos (id, project_id, title, description, status, priority, due_date, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        data.project_id,
        data.title,
        data.description,
        data.status,
        data.priority,
        data.due_date,
        timestamp,
        timestamp,
      ],
    );

    return requireTodo(id);
  },

  async update(id: string, data: UpdateTodo): Promise<Todo | null> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = { ...existing, ...data, updated_at: now() };

    await db.execute(
      `UPDATE todos SET project_id=$1, title=$2, description=$3, status=$4, priority=$5, due_date=$6, updated_at=$7
       WHERE id=$8`,
      [
        updated.project_id,
        updated.title,
        updated.description,
        updated.status,
        updated.priority,
        updated.due_date,
        updated.updated_at,
        id,
      ],
    );

    return this.getById(id);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM todos WHERE id = $1", [id]);
  },

  async toggleStatus(id: string): Promise<Todo | null> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) return null;

    const nextStatus: Record<Todo['status'], Todo['status']> = {
      pending: 'in_progress',
      in_progress: 'done',
      done: 'pending',
    };

    const newStatus = nextStatus[existing.status];
    const timestamp = now();

    await db.execute(
      "UPDATE todos SET status=$1, updated_at=$2 WHERE id=$3",
      [newStatus, timestamp, id],
    );

    return this.getById(id);
  },
};
