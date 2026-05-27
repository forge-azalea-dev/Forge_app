# Forge Checkpoint

Last updated: 2026-05-28 (smoke test passed ✓)

## Current Status

- Phase 1 selesai: structure + layout + routing + placeholder pages.
- Phase 2 selesai: database layer SQLite via `@tauri-apps/plugin-sql`.
- Phase 3 selesai: Billing page fully functional (CRUD + search + filter + seed data).
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
  - `pages/billing/index.tsx` ← **functional**
- Design tokens + global styles sudah diterapkan di `styles/globals.css`.
- Next static export sudah aktif di `next.config.ts` (`output: "export"` + `images.unoptimized: true`).
- Tauri v2 sudah terinisialisasi (`src-tauri/*` sudah ada).

## Latest Commit

- Latest: `c532a70` — `fix: add sql:allow-execute permission to Tauri capability`
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

## Phase 4 Candidates

Target fase berikutnya (belum ada spec):
- PRD Manager — pages/prd + ProjectRepo + PrdRepo
- Session Log — pages/sessions + SessionRepo
- Prompt Vault — pages/prompts + PromptRepo
- Progress Tracker — pages/progress + ProjectRepo

## Smoke Test Checklist (Phase 3)

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
