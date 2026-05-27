import { getDb, generateId, now } from "../db";
import type { Prompt, CreatePrompt, UpdatePrompt } from "../types";
import type { AiTool } from "../schema";

async function requirePrompt(id: string): Promise<Prompt> {
  const prompt = await PromptRepo.getById(id);
  if (!prompt) throw new Error(`Prompt not found for id: ${id}`);
  return prompt;
}

export const PromptRepo = {
  async getAll(): Promise<Prompt[]> {
    const db = await getDb();
    return db.select<Prompt[]>("SELECT * FROM prompts ORDER BY created_at DESC");
  },

  async getByTool(aiTool: AiTool): Promise<Prompt[]> {
    const db = await getDb();
    return db.select<Prompt[]>(
      "SELECT * FROM prompts WHERE ai_tool = $1 ORDER BY use_count DESC",
      [aiTool],
    );
  },

  async search(query: string): Promise<Prompt[]> {
    const db = await getDb();
    return db.select<Prompt[]>(
      "SELECT * FROM prompts WHERE title LIKE $1 OR content LIKE $1 ORDER BY created_at DESC",
      [`%${query}%`],
    );
  },

  async create(data: CreatePrompt): Promise<Prompt> {
    const db = await getDb();
    const id = generateId();
    const timestamp = now();

    await db.execute(
      `INSERT INTO prompts (id, title, content, ai_tool, category, tags, use_count, last_used, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,0,NULL,$7,$8)`,
      [
        id,
        data.title,
        data.content,
        data.ai_tool,
        data.category,
        data.tags,
        timestamp,
        timestamp,
      ],
    );

    return requirePrompt(id);
  },

  async getById(id: string): Promise<Prompt | null> {
    const db = await getDb();
    const results = await db.select<Prompt[]>(
      "SELECT * FROM prompts WHERE id = $1",
      [id],
    );
    return results[0] ?? null;
  },

  async incrementUseCount(id: string): Promise<void> {
    const db = await getDb();
    await db.execute(
      "UPDATE prompts SET use_count = use_count + 1, last_used = $1 WHERE id = $2",
      [now(), id],
    );
  },

  async update(id: string, data: UpdatePrompt): Promise<Prompt | null> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = { ...existing, ...data, updated_at: now() };

    await db.execute(
      "UPDATE prompts SET title=$1, content=$2, ai_tool=$3, category=$4, tags=$5, updated_at=$6 WHERE id=$7",
      [
        updated.title,
        updated.content,
        updated.ai_tool,
        updated.category,
        updated.tags,
        updated.updated_at,
        id,
      ],
    );

    return this.getById(id);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM prompts WHERE id = $1", [id]);
  },
};
