# Forge Checkpoint

Last updated: 2026-05-29 (Phase 7 implemented, pending smoke test)

## Current Status

- Phase 1 selesai: structure + layout + routing + placeholder pages.
- Phase 2 selesai: database layer SQLite via `@tauri-apps/plugin-sql`.
- Phase 3 selesai: Billing page fully functional (CRUD + search + filter + seed data).
- Phase 4 selesai: PRD Manager page fully functional (split panel, project CRUD + PRD upsert).
- Phase 5 selesai: Progress Tracker page fully functional (pipeline bar, optimistic update, status filter).
- Phase 6 selesai: Prompt Vault page fully functional (CRUD + search + filter tabs + copy clipboard + use_count).
- Phase 7 selesai: Session Log page fully functional (CRUD + expand/collapse detail + project filter + duration badge).
- Shared layout sudah terpasang (`components/Layout.tsx`) dengan:
  - sidebar navigation
  - topbar title + realtime timestamp (hydration-safe)
  - logo dari `public/forge-logo.png`
- Pages functional:
  - `pages/billing/index.tsx` ← **functional** (Phase 3)
  - `pages/prd/index.tsx` ← **functional** (Phase 4)
  - `pages/progress/index.tsx` ← **functional** (Phase 5)
  - `pages/prompts/index.tsx` ← **functional** (Phase 6)
  - `pages/sessions/index.tsx` ← **functional** (Phase 7)
- Pages placeholder:
  - `pages/index.tsx`
- Design tokens + global styles sudah diterapkan di `styles/globals.css`.
- Next static export sudah aktif di `next.config.ts` (`output: "export"` + `images.unoptimized: true`).
- Tauri v2 sudah terinisialisasi (`src-tauri/*` sudah ada).

## Latest Commit

- Latest: `37651fa` — `fix: include project_id in SessionRepo.update SQL and page update payload`
- Phase 7: `2feb5c0` — `feat: Session Log page — timeline, project filter, CRUD modal, expand/collapse`
- Phase 6: `c95904d` — `feat: Prompt Vault page — search, filter tabs, grid, copy clipboard, CRUD modal`
- Phase 5: `b5d4a09` — `feat: Progress Tracker page — filter tabs, grid, optimistic updates`
- Phase 4: `d203607` — `feat: PRD Manager page — split panel, project list + PRD editor`

## Database Layer (Phase 2 — selesai)

```
lib/
└── database/
    ├── index.ts       — barrel export
    ├── db.ts          — connection + init + seedInitialData
    ├── schema.ts      — SQL schema + type constants
    ├── types.ts       — TypeScript interfaces
    └── repositories/
        ├── billing.repo.ts
        ├── project.repo.ts
        ├── prompt.repo.ts
        └── session.repo.ts
```

## Billing Feature (Phase 3 — selesai)

```
hooks/
└── useBilling.ts              — state + CRUD + search/filter

components/billing/
├── BillingCard.tsx            — card per item, hover actions, status toggle
└── BillingForm.tsx            — modal form create/edit

pages/billing/
└── index.tsx                  — full page: list, search, filter, summary, modals
```

Seed data: Claude Pro (USD 20/month) auto-inserted on first launch.

## Known Notes

- `npx tauri dev` harus dijalankan dari folder project:
  - `cd d:\Forge-Lab\forge`
  - `npx tauri dev`
- Menjalankan `npx tauri ...` dari `d:\Forge-Lab` (root) akan gagal resolve CLI.
- Jika dev server error karena cache `.next`, stop dev lalu:
  - `if (Test-Path .next) { Remove-Item -Recurse -Force .next }`
  - start ulang `npx tauri dev`

## Tauri Permission Notes (PENTING)

`sql:default` dari `tauri-plugin-sql` v2 hanya grant: `allow-close`, `allow-load`, `allow-select`.
`allow-execute` (untuk INSERT/UPDATE/DELETE/CREATE TABLE) **TIDAK termasuk default** — harus eksplisit.

Setiap plugin Tauri baru yang ditambah: **selalu cek capabilities** dan tambah permission spesifik yang dibutuhkan.
Jangan assume `plugin:default` sudah mencakup semua operasi.

Capabilities saat ini (`src-tauri/capabilities/default.json`):
```json
"sql:default",       // allow-close, allow-load, allow-select
"sql:allow-execute"  // INSERT, UPDATE, DELETE, CREATE TABLE
```

## Progress Tracker Feature (Phase 5 — selesai)

```
hooks/
└── useProgress.ts                 — filteredProjects, statusFilter, updatePhase/Status (optimistic)

components/progress/
├── PipelineBar.tsx                — 6-phase clickable bar (completed/active/upcoming states)
└── ProjectProgressCard.tsx        — card: name, stack, status select, PipelineBar

pages/progress/
└── index.tsx                      — filter tabs (All/Active/Paused/Completed), 2-col grid, empty state
```

Optimistic update: local state diupdate dulu sebelum DB call. Rollback via `fetchProjects()` jika DB error.
Status filter "Archived" tidak ada di tabs (archived projects tersembunyi dari tracker, intentional).

## PRD Manager Feature (Phase 4 — selesai)

```
lib/database/
├── types.ts               — tambah CreatePrd, UpdatePrd
└── repositories/
    └── prd.repo.ts        — getByProject, upsert (1 PRD per project), delete

hooks/
└── usePRD.ts              — state: projects, selectedProject, activePrd, saveAll

components/prd/
├── ProjectList.tsx        — left panel: list, inline add, hover delete
└── PRDEditor.tsx          — right panel: project + PRD form, save feedback

pages/prd/
└── index.tsx              — split panel layout (w-56 left + flex-1 right)
```

Design: `key={selectedProject.id}` pada PRDEditor memaksa remount saat ganti project.
`useEffect([project.id, prd?.id])` di PRDEditor sync form fields setelah async PRD load.
`PrdRepo.upsert` handle create-or-update (1 PRD per project).

## SQLite Notes (PENTING)

`PRAGMA foreign_keys = ON` ditambah di `db.ts` agar `ON DELETE CASCADE` pada `prds.project_id` bekerja.
Tanpa pragma ini, hapus project tidak akan cascade ke PRD terkait (SQLite default FK = OFF).

## Prompt Vault Feature (Phase 6 — selesai)

```
hooks/
└── usePrompts.ts                  — state: prompts, toolFilter, searchQuery, loading, error
                                     CRUD + copyPrompt (clipboard + optimistic use_count)
                                     client-side filter by tool AND search

components/prompts/
├── PromptCard.tsx                 — card: title, ai_tool badge (warna per tool), category,
│                                    2-line content preview, use_count + last_used footer,
│                                    click-to-copy flash ("Copied!"), hover edit/delete
└── PromptForm.tsx                 — modal: create/edit — title, content, ai_tool select, category

pages/prompts/
└── index.tsx                      — search bar, filter tabs (All + 6 tools), 3-col grid, empty state
```

AI tool badge colors: claude=#C41E3A · chatgpt=#10A37F · ideogram=#6366F1 · stitch=#F59E0B · cursor=#3B82F6 · custom=#666666
Copy to clipboard: `navigator.clipboard.writeText()` + `PromptRepo.incrementUseCount()` (optimistic).
`setError(null)` di awal setiap mutation agar error bar tidak stale.

## Session Log Feature (Phase 7 — selesai)

```
hooks/
└── useSession.ts                  — state: sessions, projects, projectFilter, loading, error
                                     CRUD + optimistic delete + parallel load sessions+projects
                                     client-side filter by project_id

components/sessions/
├── SessionCard.tsx                — card: title, duration badge ("Xh Ym"), project label,
│                                    timestamp ("DD MMM YYYY • HH:mm" id-ID locale),
│                                    2-line summary preview (collapsed),
│                                    click → expand detail (summary + decisions + next_steps),
│                                    hover edit/delete
└── SessionForm.tsx                — modal: create/edit — title, project_id select, summary,
                                     decisions, next_steps, duration (menit)

pages/sessions/
└── index.tsx                      — project filter dropdown, timeline list (space-y-3),
                                     two-variant empty state, CRUD modal
```

`SessionRepo.update()` dipatch include `project_id` — project bisa di-reassign saat edit.
`started_at` auto-set ke `new Date().toISOString()` saat create (tidak ada di form).
`setError(null)` di awal setiap mutation agar error bar tidak stale.
`SessionFormData` derived dari `Omit<CreateSession, "started_at" | "ended_at">`.

## Phase 8 Candidates

Target fase berikutnya (belum ada spec):
- Dashboard / Home — `pages/index.tsx` (summary stats, recent sessions, quick actions)
- AI Integration — Anthropic API untuk generate PRD draft & summarize session

## Smoke Test Checklist (Phase 7 — Session Log)

Jalankan `npx tauri dev` dari `d:\Forge-Lab\forge` lalu verifikasi:

| Test | Expected |
|------|----------|
| Buka halaman Session Log | Empty state "Belum ada sesi" + hint text |
| Klik "+ New Session" | Modal terbuka (judul "New Session") |
| Isi title saja → "Add Session" | Sesi muncul di timeline, modal tutup |
| Isi semua field termasuk duration 90 → "Add Session" | Card tampil dengan badge "1h 30m" |
| Klik card | Detail expand — summary, decisions, next_steps tampil |
| Klik card lagi | Collapse — kembali ke 2-line preview |
| Card tanpa summary/decisions/next_steps | Tidak ada "▼ detail" indicator |
| Hover card → klik Pencil | Edit modal terbuka dengan data existing (judul "Edit Session") |
| Edit title + ganti project → "Save Changes" | Title dan project terupdate di card |
| Hover card → klik Trash | Confirm "Hapus sesi ini?" → sesi terhapus |
| Pilih project di dropdown filter | Hanya sesi untuk project itu tampil |
| Filter project tanpa sesi | Empty state "Belum ada sesi untuk [project]" |
| Pilih "Semua Project" | Semua sesi tampil kembali |
| Timestamp format | "DD MMM YYYY • HH:mm" (contoh: "29 Mei 2026 • 14:30") |

## Smoke Test Checklist (Phase 6 — Prompt Vault)

Jalankan `npx tauri dev` dari `d:\Forge-Lab\forge` lalu verifikasi:

| Test | Expected |
|------|----------|
| Buka halaman Prompt Vault | Empty state "Belum ada prompt" |
| Klik "+ Add Prompt" | Modal PromptForm terbuka (judul "New Prompt") |
| Isi title + content + pilih AI tool → "Add Prompt" | Prompt muncul di grid, modal tutup |
| Klik card prompt | Flash "Copied!" muncul sebentar, konten ter-copy ke clipboard |
| Cek use_count setelah klik | Counter bertambah (×1 used → ×2 used dst) |
| Ketik di search box | Grid filter realtime by title/content |
| Klik tab "Claude" | Hanya prompt claude tampil |
| Klik tab "All" | Semua prompt tampil kembali |
| Hover card → klik Pencil | Modal edit terbuka dengan data existing (judul "Edit Prompt") |
| Edit data → "Save Changes" | Data terupdate di grid |
| Hover card → klik Trash | Confirm dialog → prompt terhapus |
| Tambah prompt untuk tool berbeda | Badge warna berbeda sesuai tool |

## Smoke Test Checklist (Phase 5 — Progress Tracker)

Jalankan `npx tauri dev` dari `d:\Forge-Lab\forge` lalu verifikasi:

| Test | Expected |
|------|----------|
| Buka halaman Progress Tracker | Grid project cards muncul (atau empty state jika belum ada project) |
| Klik tab "Active" | Hanya project active tampil |
| Klik tab "All" | Semua project tampil kembali |
| Klik fase di PipelineBar | Fase langsung ter-highlight (optimistic), DB tersimpan di background |
| Klik completed phases (sebelum current) | Phases di-klik bisa mundur ke fase sebelumnya |
| Ubah status via dropdown | Status badge langsung berubah warna (optimistic) |
| Filter "Paused" setelah ubah status ke paused | Project muncul di tab Paused |

## Smoke Test Checklist (Phase 4 — PRD Manager)

Jalankan `npx tauri dev` dari `d:\Forge-Lab\forge` lalu verifikasi:

| Test | Expected |
|------|----------|
| Buka halaman PRD Manager | Panel kiri kosong "Belum ada project", panel kanan empty state |
| Klik `+` di header panel kiri | Inline form muncul |
| Isi nama → klik "Add" | Project muncul di list, auto-selected, editor tampil di kanan |
| Isi field di editor → klik "Save" | Label "Tersimpan HH:MM" muncul di toolbar |
| Ganti project di panel kiri | Editor reset ke data project yang dipilih |
| Hover project row | Trash icon muncul |
| Klik Trash → konfirmasi | Project terhapus, PRD terkait terhapus (cascade), list refresh |
| Tambah project kedua → isi PRD → save | Data tersimpan, ganti ke project 1 → data project 1 tampil kembali |

## Smoke Test Checklist (Phase 3 — Billing)

Jalankan `npx tauri dev` dari `d:\Forge-Lab\forge` lalu verifikasi:

| Test | Expected |
|------|----------|
| Buka halaman Billing | Claude Pro muncul sebagai item pertama |
| Summary bar terlihat | Total Aktif: 1 · Bulan Ini: ~20 · Tahunan: ~240 |
| Klik "+ Add Subscription" | Modal BillingForm terbuka |
| Isi form → klik "Add Subscription" | Data tersimpan, modal tutup, list refresh |
| Hover card → klik Pencil | Edit modal terbuka dengan data existing |
| Edit data → "Save Changes" | Data terupdate di list |
| Hover card → klik Trash | Confirm dialog muncul → data terhapus |
| Klik status badge di card | Status toggle (active→paused→active) |
| Ketik di search box | List filter realtime |
| Klik tab "Active" / "Paused" | Filter bekerja |
