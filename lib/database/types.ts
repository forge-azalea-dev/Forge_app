import type {
  Phase,
  AiTool,
  BillingCycle,
  ProjectStatus,
  BillingStatus,
} from "./schema";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  stack: string | null;
  phase: Phase;
  status: ProjectStatus;
  figma_url: string | null;
  repo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prd {
  id: string;
  project_id: string;
  title: string;
  content: string | null;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  ai_tool: AiTool;
  category: string | null;
  tags: string | null;
  use_count: number;
  last_used: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  project_id: string | null;
  title: string;
  summary: string | null;
  decisions: string | null;
  next_steps: string | null;
  duration: number | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface Billing {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  cycle: BillingCycle;
  billing_date: number;
  next_billing: string | null;
  status: BillingStatus;
  category: string | null;
  url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateProject = Omit<Project, "id" | "created_at" | "updated_at">;
export type UpdateProject = Partial<CreateProject>;

export type CreatePrompt = Omit<
  Prompt,
  "id" | "use_count" | "last_used" | "created_at" | "updated_at"
>;
export type UpdatePrompt = Partial<CreatePrompt>;

export type CreateSession = Omit<Session, "id" | "created_at">;
export type UpdateSession = Partial<Omit<CreateSession, "started_at">>;

export type CreateBilling = Omit<Billing, "id" | "created_at" | "updated_at">;
export type UpdateBilling = Partial<CreateBilling>;

export type CreatePrd = Omit<Prd, "id" | "created_at" | "updated_at">;
export type UpdatePrd = Partial<Omit<CreatePrd, "project_id">>;

export interface Todo {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}
export type CreateTodo = Omit<Todo, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTodo = Partial<CreateTodo>;
