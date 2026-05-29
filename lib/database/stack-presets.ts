export const STACK_CATEGORIES = ['language', 'frontend', 'backend', 'database', 'auth', 'styling', 'deploy'] as const;
export type StackCategory = typeof STACK_CATEGORIES[number];

export const CATEGORY_LABELS: Record<StackCategory, string> = {
  language: 'Language',
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  auth: 'Auth',
  styling: 'Styling',
  deploy: 'Deploy',
};

export const STACK_PRESETS: Record<StackCategory, string[]> = {
  language: ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go'],
  frontend: ['Next.js', 'React', 'Vue', 'Svelte', 'Astro', 'Angular'],
  backend: ['Supabase', 'Express', 'FastAPI', 'Flask', 'Django', 'NestJS', 'Hono'],
  database: ['PostgreSQL', 'SQLite', 'MySQL', 'MongoDB', 'Redis'],
  auth: ['Supabase Auth', 'NextAuth', 'Clerk', 'Auth0', 'Firebase Auth'],
  styling: ['Tailwind CSS', 'CSS Modules', 'Styled Components', 'Chakra UI', 'shadcn/ui'],
  deploy: ['Vercel', 'Tauri', 'Railway', 'Fly.io', 'Netlify', 'Docker', 'VPS'],
};

export function emptyStack(): Record<StackCategory, string[]> {
  return Object.fromEntries(STACK_CATEGORIES.map(c => [c, []])) as unknown as Record<StackCategory, string[]>;
}

export function parseStack(json: string | null): Record<StackCategory, string[]> {
  if (!json) return emptyStack();
  try {
    const parsed = JSON.parse(json) as Partial<Record<StackCategory, string[]>>;
    return Object.fromEntries(
      STACK_CATEGORIES.map(c => [c, Array.isArray(parsed[c]) ? parsed[c]! : []])
    ) as unknown as Record<StackCategory, string[]>;
  } catch {
    return emptyStack();
  }
}

export function stringifyStack(stack: Record<StackCategory, string[]>): string | null {
  const hasAny = STACK_CATEGORIES.some(c => stack[c].length > 0);
  if (!hasAny) return null;
  return JSON.stringify(stack);
}
