export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    stack       TEXT,
    phase       TEXT NOT NULL DEFAULT 'prd',
    status      TEXT NOT NULL DEFAULT 'active',
    figma_url   TEXT,
    repo_url    TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prds (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL,
    title       TEXT NOT NULL,
    content     TEXT,
    version     TEXT NOT NULL DEFAULT '1.0',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS prompts (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,
    ai_tool     TEXT NOT NULL DEFAULT 'custom',
    category    TEXT,
    tags        TEXT,
    use_count   INTEGER NOT NULL DEFAULT 0,
    last_used   TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    project_id  TEXT,
    title       TEXT NOT NULL,
    summary     TEXT,
    decisions   TEXT,
    next_steps  TEXT,
    duration    INTEGER,
    started_at  TEXT NOT NULL,
    ended_at    TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS billing (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    description    TEXT,
    amount         REAL NOT NULL,
    currency       TEXT NOT NULL DEFAULT 'USD',
    cycle          TEXT NOT NULL DEFAULT 'monthly',
    billing_date   INTEGER NOT NULL,
    next_billing   TEXT,
    status         TEXT NOT NULL DEFAULT 'active',
    category       TEXT,
    url            TEXT,
    notes          TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS todos (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    priority    TEXT NOT NULL DEFAULT 'medium',
    due_date    TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
`;

export const PHASES = [
  "prd",
  "uiux",
  "frontend",
  "backend",
  "integration",
  "deploy",
] as const;

export type Phase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<Phase, string> = {
  prd: "PRD",
  uiux: "UI/UX",
  frontend: "Frontend",
  backend: "Backend",
  integration: "Integration",
  deploy: "Deploy",
};

export const AI_TOOLS = [
  "claude",
  "chatgpt",
  "ideogram",
  "stitch",
  "cursor",
  "custom",
] as const;

export type AiTool = (typeof AI_TOOLS)[number];

export const BILLING_CYCLES = ["monthly", "yearly", "one-time"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const PROJECT_STATUSES = [
  "active",
  "paused",
  "completed",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const BILLING_STATUSES = ["active", "paused", "cancelled"] as const;
export type BillingStatus = (typeof BILLING_STATUSES)[number];
