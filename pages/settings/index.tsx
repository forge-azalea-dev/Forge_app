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
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
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
      .catch(() => {
        setMessageType("error");
        setStatusMessage("Gagal memuat konfigurasi tersimpan.");
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    setMessageType(null);
    try {
      const trimmed = apiKey.trim();
      if (trimmed) {
        await setConfig(ConfigKeys.ANTHROPIC_API_KEY, trimmed);
        setStatus("saved");
        setMessageType("success");
        setStatusMessage("API key tersimpan.");
      } else {
        await deleteConfig(ConfigKeys.ANTHROPIC_API_KEY);
        setStatus("unconfigured");
        setMessageType("success");
        setStatusMessage("API key dihapus.");
      }
    } catch (err) {
      setMessageType("error");
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
      setMessageType("error");
      setStatusMessage("Masukkan API key terlebih dahulu.");
      return;
    }
    setTesting(true);
    setStatus("testing");
    setStatusMessage(null);
    setMessageType(null);
    try {
      const ok = await testApiKey(trimmed);
      if (ok) {
        setStatus("connected");
        setMessageType(null);
        setStatusMessage(null);
      } else {
        setStatus("invalid");
        setMessageType("error");
        setStatusMessage(
          "API key tidak valid atau tidak dapat terhubung ke Anthropic.",
        );
      }
    } catch {
      setStatus("invalid");
      setMessageType("error");
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
          <p className={`font-mono text-xs ${messageType === "success" ? "text-[#22c55e]" : "text-[#C41E3A]"}`}>
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
