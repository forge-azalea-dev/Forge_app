# Forge Checkpoint

Last updated: 2026-05-28

## Current Status

- Phase 1 selesai: structure + layout + routing + placeholder pages.
- Shared layout sudah terpasang (`components/Layout.tsx`) dengan:
  - sidebar navigation
  - topbar title + realtime timestamp (hydration-safe)
  - logo dari `public/forge-logo.png`
- Pages placeholder sudah tersedia:
  - `pages/index.tsx`
  - `pages/prd/index.tsx`
  - `pages/progress/index.tsx`
  - `pages/prompts/index.tsx`
  - `pages/sessions/index.tsx`
  - `pages/billing/index.tsx`
- Design tokens + global styles sudah diterapkan di `styles/globals.css`.
- Next static export sudah aktif di `next.config.ts` (`output: "export"` + `images.unoptimized: true`).
- Tauri v2 sudah terinisialisasi (`src-tauri/*` sudah ada).

## Latest Commit

- Commit: `590714c`
- Message: `feat: phase 1 - layout, routing, placeholder pages`

## Known Notes

- `npx tauri dev` harus dijalankan dari folder project:
  - `cd d:\Forge-Lab\forge`
  - `npx tauri dev`
- Menjalankan `npx tauri ...` dari `d:\Forge-Lab` (root) akan gagal resolve CLI.
- Jika dev server error karena cache `.next`, stop dev lalu:
  - `if (Test-Path .next) { Remove-Item -Recurse -Force .next }`
  - start ulang `npx tauri dev`

## Phase 2 Preparation (Database Layer)

Target fase berikutnya: setup database layer SQLite via Tauri commands.

Planned baseline:

1. Define DB module boundaries:
   - schema/migrations
   - query layer (Rust)
   - command handlers (Tauri `invoke`)
2. Create initial schema versioning strategy.
3. Add first migration for core entities (minimal):
   - projects
   - prds
   - sessions
   - prompts
   - progress entries
4. Expose typed Tauri commands for CRUD (no direct frontend DB access).
5. Frontend data-access wrappers (`invoke`) per feature module.
6. Sanitize inputs + use parameterized queries only.
7. Verify with local smoke test from UI route.

## Resume Prompt (Optional)

Gunakan prompt ini untuk lanjut cepat:

> "Lanjut Phase 2 Forge: setup database layer SQLite via Tauri commands dengan migration versioned, query parameterized, dan wrapper invoke typed di frontend. Mulai dari fondasi schema + 1 migration awal untuk projects, prds, sessions, prompts, progress."

