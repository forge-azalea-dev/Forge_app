import { getDb, generateId, now } from "../db";
import type { Project, CreateProject, UpdateProject } from "../types";
import type { ProjectStatus } from "../schema";

async function requireProject(id: string): Promise<Project> {
  const project = await ProjectRepo.getById(id);
  if (!project) throw new Error(`Project not found for id: ${id}`);
  return project;
}

export const ProjectRepo = {
  async getAll(): Promise<Project[]> {
    const db = await getDb();
    return db.select<Project[]>("SELECT * FROM projects ORDER BY updated_at DESC");
  },

  async getByStatus(status: ProjectStatus): Promise<Project[]> {
    const db = await getDb();
    return db.select<Project[]>(
      "SELECT * FROM projects WHERE status = $1 ORDER BY updated_at DESC",
      [status],
    );
  },

  async getActive(): Promise<Project[]> {
    return this.getByStatus("active");
  },

  async getById(id: string): Promise<Project | null> {
    const db = await getDb();
    const results = await db.select<Project[]>(
      "SELECT * FROM projects WHERE id = $1",
      [id],
    );
    return results[0] ?? null;
  },

  async create(data: CreateProject): Promise<Project> {
    const db = await getDb();
    const id = generateId();
    const timestamp = now();

    await db.execute(
      `INSERT INTO projects (id, name, description, stack, phase, status, figma_url, repo_url, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        data.name,
        data.description,
        data.stack,
        data.phase,
        data.status,
        data.figma_url,
        data.repo_url,
        timestamp,
        timestamp,
      ],
    );

    return requireProject(id);
  },

  async update(id: string, data: UpdateProject): Promise<Project | null> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = { ...existing, ...data, updated_at: now() };

    await db.execute(
      `UPDATE projects SET name=$1, description=$2, stack=$3, phase=$4, status=$5,
       figma_url=$6, repo_url=$7, updated_at=$8 WHERE id=$9`,
      [
        updated.name,
        updated.description,
        updated.stack,
        updated.phase,
        updated.status,
        updated.figma_url,
        updated.repo_url,
        updated.updated_at,
        id,
      ],
    );

    return this.getById(id);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM projects WHERE id = $1", [id]);
  },
};
