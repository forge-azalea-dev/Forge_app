# Forge Checkpoint

Last updated: 2026-05-28 (Phase 4 implemented, pending smoke test)

## Current Status

- Phase 1 selesai: structure + layout + routing + placeholder pages.
- Phase 2 selesai: database layer SQLite via `@tauri-apps/plugin-sql`.
- Phase 3 selesai: Billing page fully functional (CRUD + search + filter + seed data).
- Phase 4 selesai: PRD Manager page fully functional (split panel, project CRUD + PRD upsert).
- Shared layout sudah terpasang (`components/Layout.tsx`) dengan:
  - sidebar navigation
  - topbar title + realtime timestamp (hydration-safe)
  - logo dari `public/forge-logo.png`
- Pages functional:
  - `pages/billing/index.tsx` ← **functional** (Phase 3)
  - `pages/prd/index.tsx` ← **functional** (Phase 4)
- Pages placeholder:
  - `pages/index.tsx`
  - `pages/progress/index.tsx`
  - `pages/prompts/index.tsx`
  - `pages/sessions/index.tsx`
- Design tokens + global styles sudah diterapkan di `styles/globals.css`.
- Next static export sudah aktif di `next.config.ts` (`output: "export"` + `images.unoptimized: true`).
- Tauri v2 sudah terinisialisasi (`src-tauri/*` sudah ada).

## Latest Commit

- Latest: `44895fb` — `fix: enable SQLite foreign key enforcement (PRAGMA foreign_keys = ON)`
- Phase 4: `d203607` — `feat: PRD Manager page — split panel, project list + PRD editor`
- Phase 3: `12f8d52` — `feat: billing page fully functional — CRUD, search, filter, summary`

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

## Phase 5 Candidates

Target fase berikutnya (belum ada spec):
- Session Log — pages/sessions + SessionRepo
- Prompt Vault — pages/prompts + PromptRepo
- Progress Tracker — pages/progress + ProjectRepo

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
