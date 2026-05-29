# Phase 8a: AI Integration Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setup Anthropic API key management and a reusable AI hook as the foundation for AI features in Forge.

**Architecture:** API key stored in Tauri store plugin (never in localStorage or hardcoded), accessed via a thin `lib/config.ts` wrapper. A `hooks/useAI.ts` hook wraps the Anthropic API with proper error handling. A new Settings page lets the user configure and test the key.

**Tech Stack:** Tauri v2, tauri-plugin-store v2, @tauri-apps/plugin-store, Anthropic API (claude-haiku-4-5-20251001), Next.js Pages Router, TypeScript strict, Tailwind CSS v4

---

## File Structure

**New files:**
- `lib/config.ts` — Tauri store wrapper for persistent app config (key-value)
- `hooks/useAI.ts` — Anthropic API hook (generate, isConfigured, loading, error)
- `pages/settings/index.tsx` — Settings page: API key input + test connection

**Modified files:**
- `src-tauri/Cargo.toml` — add `tauri-plugin-store = "2"`
- `src-tauri/src/lib.rs` — register store plugin builder
- `src-tauri/capabilities/default.json` — add `"store:default"` permission
- `components/Layout.tsx` — add Settings nav item with gear icon

---

### Task 1: Plugin Setup + Config Module

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/capabilities/default.json`
- Create: `lib/config.ts`

- [ ] **Install npm package**

```bash
cd d:\Forge-Lab\forge && npm install @tauri-apps/plugin-store
```

Expected: `@tauri-apps/plugin-store` added to `package.json` dependencies.

- [ ] **Add Rust dependency in `src-tauri/Cargo.toml`**

After the existing `tauri-plugin-sql` line, add:
```toml
tauri-plugin-store = "2"
```

Full `[dependencies]` block:
```toml
[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
log = "0.4"
tauri = { version = "2.11.2", features = [] }
tauri-plugin-log = "2"
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-store = "2"
```

- [ ] **Register store plugin in `src-tauri/src/lib.rs`**

Replace entire file content:
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

- [ ] **Add permission in `src-tauri/capabilities/default.json`**

Replace entire file content:
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "enables the default permissions",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "sql:default",
    "sql:allow-execute",
    "store:default"
  ]
}
```

- [ ] **Create `lib/config.ts`**

```typescript
import { load } from "@tauri-apps/plugin-store";

const STORE_FILE = "config.json";

export const ConfigKeys = {
  ANTHROPIC_API_KEY: "anthropic_api_key",
} as const;

export async function getConfig(key: string): Promise<string | null> {
  const store = await load(STORE_FILE, { autoSave: false });
  const value = await store.get<string>(key);
  return value ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const store = await load(STORE_FILE, { autoSave: false });
  await store.set(key, value);
  await store.save();
}

export async function deleteConfig(key: string): Promise<void> {
  const store = await load(STORE_FILE, { autoSave: false });
  await store.delete(key);
  await store.save();
}
```

- [ ] **Verify TypeScript types**

```bash
cd d:\Forge-Lab\forge && npx next build
```

Expected: Build succeeds with no TypeScript errors. (Rust compilation happens via `npx tauri dev`, not here.)

- [ ] **Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/lib.rs src-tauri/capabilities/default.json lib/config.ts package.json package-lock.json
git commit -m "feat: add tauri-plugin-store + config module for API key storage"
```

---

### Task 2: useAI Hook

**Files:**
- Create: `hooks/useAI.ts`

**Security notes for this task:**
- API key is read fresh from the store on every `generate()` call — never cached in JS module scope
- API key is passed in `x-api-key` HTTP header only — never written to console.log or error message strings
- `anthropic-dangerous-direct-browser-access: true` header is required because Tauri's WebView (WebView2 on Windows) is a browser-like environment; Anthropic blocks WebView requests without it
- HTTPS enforces TLS — on Windows 11, WebView2 uses the system TLS stack (TLS 1.3 by default) with no extra configuration needed
- Error paths surface only `response.status` and `response.statusText`, not request headers

- [ ] **Create `hooks/useAI.ts`**

```typescript
import { useState, useEffect } from "react";
import { getConfig, ConfigKeys } from "@/lib/config";

interface AnthropicMessage {
  type: string;
  text: string;
}

interface AnthropicResponse {
  content: AnthropicMessage[];
}

interface UseAIReturn {
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  generate: (systemPrompt: string, userPrompt: string) => Promise<string>;
}

export function useAI(): UseAIReturn {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getConfig(ConfigKeys.ANTHROPIC_API_KEY)
      .then((key) => setIsConfigured(key !== null && key.trim().length > 0))
      .catch(() => setIsConfigured(false));
  }, []);

  const generate = async (
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> => {
    setError(null);
    setIsLoading(true);
    try {
      const apiKey = await getConfig(ConfigKeys.ANTHROPIC_API_KEY);
      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error(
          "API key belum dikonfigurasi. Buka Settings untuk menambahkan.",
        );
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [{ role: "user", content: userPrompt }],
          system: systemPrompt,
        }),
      });

      if (response.status === 401) {
        throw new Error(
          "API key tidak valid. Periksa kembali di halaman Settings.",
        );
      }
      if (response.status === 429) {
        throw new Error("Rate limit tercapai. Coba lagi beberapa saat.");
      }
      if (!response.ok) {
        throw new Error(
          `Anthropic API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as AnthropicResponse;
      const first = data.content[0];
      if (!first || first.type !== "text") {
        throw new Error("Unexpected response format dari Anthropic API.");
      }
      return first.text;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal generate respons AI.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { isConfigured, isLoading, error, generate };
}
```

- [ ] **Verify TypeScript types**

```bash
cd d:\Forge-Lab\forge && npx next build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Commit**

```bash
git add hooks/useAI.ts
git commit -m "feat: add useAI hook with Anthropic API integration"
```

---

### Task 3: Settings Page + Layout Nav

**Files:**
- Create: `pages/settings/index.tsx`
- Modify: `components/Layout.tsx`

**Security notes for this task:**
- Input is `type="password"` by default — key is masked in DOM
- Show/hide toggle only changes render state, does not modify stored value
- API key value is never written to console.log in any handler
- Test connection sends a minimal prompt (max_tokens: 10) to verify key validity
- `testApiKey` is a module-level function (not a hook) — callable with an unsaved key from the input state, so the user can test before committing to save

- [ ] **Modify `components/Layout.tsx`**

**Step 1 — Add `Settings` to lucide import** (line ~11):
```typescript
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  BookMarked,
  Clock,
  CreditCard,
  Settings,
} from "lucide-react";
```

**Step 2 — Add `"settings"` to `PageKey` type** (after `"billing"`):
```typescript
type PageKey =
  | "dashboard"
  | "prd"
  | "progress"
  | "prompts"
  | "sessions"
  | "billing"
  | "settings";
```

**Step 3 — Add to `PAGE_TITLES`** (after `billing` entry):
```typescript
settings: "Settings",
```

**Step 4 — Add to `getPageKey`** (before `return "dashboard"`):
```typescript
if (pathname.startsWith("/settings")) return "settings";
```

**Step 5 — Add to `navItems` array** (after the `billing` nav item):
```typescript
{
  label: "Settings",
  href: "/settings",
  icon: <Settings className="h-4 w-4" />,
  key: "settings",
},
```

- [ ] **Create `pages/settings/index.tsx`**

```typescript
import { useState, useEffect } from "react";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { getConfig, setConfig, deleteConfig, ConfigKeys } from "@/lib/config";

type ConnectionStatus =
  | "unconfigured"
  | "saved"
  | "connected"
  | "invalid"
  | "testing";

interface AnthropicMessage {
  type: string;
  text: string;
}

interface AnthropicResponse {
  content: AnthropicMessage[];
}

async function testApiKey(key: string): Promise<boolean> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [{ role: "user", content: "Reply with only: OK" }],
      system: "You are a helpful assistant.",
    }),
  });
  if (!response.ok) return false;
  const data = (await response.json()) as AnthropicResponse;
  const first = data.content[0];
  return first?.type === "text" && first.text.includes("OK");
}

export default function SettingsPage() {
  const [apiKey, setApiKeyState] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("unconfigured");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getConfig(ConfigKeys.ANTHROPIC_API_KEY)
      .then((key) => {
        if (key) {
          setApiKeyState(key);
          setStatus("saved");
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const trimmed = apiKey.trim();
      if (trimmed) {
        await setConfig(ConfigKeys.ANTHROPIC_API_KEY, trimmed);
        setStatus("saved");
        setStatusMessage("API key tersimpan.");
      } else {
        await deleteConfig(ConfigKeys.ANTHROPIC_API_KEY);
        setStatus("unconfigured");
        setStatusMessage("API key dihapus.");
      }
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : "Gagal menyimpan API key.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStatusMessage("Masukkan API key terlebih dahulu.");
      return;
    }
    setTesting(true);
    setStatus("testing");
    setStatusMessage(null);
    try {
      const ok = await testApiKey(trimmed);
      if (ok) {
        setStatus("connected");
        setStatusMessage(null);
      } else {
        setStatus("invalid");
        setStatusMessage(
          "API key tidak valid atau tidak dapat terhubung ke Anthropic.",
        );
      }
    } catch {
      setStatus("invalid");
      setStatusMessage(
        "Gagal terhubung ke Anthropic API. Periksa koneksi internet.",
      );
    } finally {
      setTesting(false);
    }
  };

  const renderStatusBadge = () => {
    switch (status) {
      case "connected":
        return (
          <span className="flex items-center gap-1.5 font-mono text-xs text-[#22c55e]">
            <Check className="h-3 w-3" />
            Connected
          </span>
        );
      case "invalid":
        return (
          <span className="flex items-center gap-1.5 font-mono text-xs text-[#C41E3A]">
            <X className="h-3 w-3" />
            Invalid Key
          </span>
        );
      case "testing":
        return (
          <span className="flex items-center gap-1.5 font-mono text-xs text-[#666666]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Menguji...
          </span>
        );
      case "saved":
        return (
          <span className="font-mono text-xs text-[#666666]">
            Tersimpan (belum diuji)
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs text-[#444444]">
            Belum dikonfigurasi
          </span>
        );
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Settings
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Konfigurasi AI integration dan preferensi app.
        </p>
      </div>

      <div className="space-y-4 rounded-[6px] border border-[rgba(139,0,0,0.2)] bg-[#111111] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-text)]">
            Anthropic API
          </h2>
          {renderStatusBadge()}
        </div>

        <div className="space-y-2">
          <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666]">
            API Key
          </label>
          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              placeholder="sk-ant-api03-..."
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#0A0A0A] px-3 py-2 pr-10 font-mono text-xs text-[#F0F0F0] placeholder-[#333333] outline-none focus:border-[#C41E3A] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 text-[#444444] hover:text-[#888888] transition-colors"
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="font-mono text-[10px] text-[#444444]">
            Disimpan lokal. Tidak pernah dikirim selain ke Anthropic API.
          </p>
        </div>

        {statusMessage && (
          <p
            className={`font-mono text-xs ${
              status === "connected" || statusMessage.includes("tersimpan")
                ? "text-[#22c55e]"
                : "text-[#C41E3A]"
            }`}
          >
            {statusMessage}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || testing}
            className="rounded-[4px] border border-[rgba(139,0,0,0.3)] bg-[#111111] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] hover:bg-[rgba(139,0,0,0.15)] hover:border-[#C41E3A] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Save"}
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || saving}
            className="rounded-[4px] border border-[rgba(139,0,0,0.3)] bg-[#111111] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] hover:bg-[rgba(139,0,0,0.15)] hover:border-[#C41E3A] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testing ? "Menguji..." : "Test Connection"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Verify TypeScript types**

```bash
cd d:\Forge-Lab\forge && npx next build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Commit**

```bash
git add pages/settings/index.tsx components/Layout.tsx
git commit -m "feat: Settings page — API key config, show/hide, test connection + nav item"
```

---

## Security Audit

| Concern | Implementation | Status |
|---------|---------------|--------|
| API key storage | Tauri store (JSON in `%APPDATA%\com.forgelab.app\`) — protected by OS ACLs | Acceptable for personal desktop app |
| API key in logs | Never passed to console.log; error handlers surface only `status`/`statusText` | Enforced by code |
| API key in errors | Error messages are static strings — do not include header values | Enforced by code |
| API key in UI | `type="password"` by default; show/hide toggle only changes render | Enforced by HTML |
| Data in transit | HTTPS to `api.anthropic.com`; Windows 11 WebView2 uses TLS 1.3 | Enforced by OS |
| SQL injection | `lib/config.ts` uses Tauri store (key-value), not SQL | Not applicable |
| CORS | `anthropic-dangerous-direct-browser-access: true` header enables WebView access | Required, documented |
| Future hardening | `tauri-plugin-stronghold` would provide encrypted-at-rest key storage | Out of scope for Phase 8a |

---

## Smoke Test Checklist (Phase 8a)

Run `npx tauri dev` from `d:\Forge-Lab\forge` then verify:

| Test | Expected |
|------|----------|
| Settings appears in sidebar | Gear icon + "Settings" label |
| Open Settings page | "Belum dikonfigurasi" badge, empty input |
| Enter API key → Save | "Tersimpan (belum diuji)" badge, "API key tersimpan." message |
| Reload app → open Settings | Saved key pre-fills input (masked) |
| Click show/hide button | Key toggles between masked and visible |
| Enter invalid key → Test Connection | "Invalid Key ✗" badge, error message |
| Enter valid key → Test Connection | "Connected ✓" badge |
| Clear input → Save | "Belum dikonfigurasi" badge, "API key dihapus." message |
| Other pages still work | No regressions in Billing, PRD, Progress, Prompts, Sessions |
