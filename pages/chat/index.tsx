import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { ProjectRepo } from "@/lib/database";
import type { Project } from "@/lib/database";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const {
    messages,
    isLoading,
    error,
    isConfigured,
    selectedProjectId,
    setSelectedProjectId,
    sendMessage,
    clearChat,
  } = useChat();

  const [projects, setProjects] = useState<Project[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ProjectRepo.getAll()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      void handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem-2rem)] flex-col">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.15em] text-[#F0F0F0]">
            AI ASSISTANT
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-[#666666]">
            Context-aware dengan data Forge kamu
          </p>
        </div>
        <button
          onClick={clearChat}
          className="rounded-[4px] border border-[rgba(139,0,0,0.3)] px-3 py-1 font-mono text-xs text-[#888888] transition-colors hover:border-[rgba(139,0,0,0.6)] hover:text-[#F0F0F0]"
        >
          Clear
        </button>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto rounded-[6px] border border-[rgba(139,0,0,0.15)] bg-[#0A0A0A] px-4 py-4">
        {/* API key not configured banner */}
        {!isConfigured && (
          <div className="mb-4 rounded-[4px] border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.1)] px-4 py-2 font-mono text-xs text-[#FF6666]">
            API key belum dikonfigurasi. Buka Settings untuk menambahkan.
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-4 rounded-[4px] border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.1)] px-4 py-2 font-mono text-xs text-[#FF6666]">
            {error}
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !isLoading && isConfigured && !error && (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[8px] border border-[rgba(139,0,0,0.25)] bg-[rgba(139,0,0,0.08)]">
              <span className="font-mono text-lg font-bold text-[rgba(139,0,0,0.6)]">F</span>
            </div>
            <p className="font-mono text-sm text-[#666666]">
              Halo! Saya AI Assistant Forge.
            </p>
            <p className="mt-1 font-mono text-xs text-[#444444]">
              Pilih project context di atas, lalu tanya apa saja.
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={[
                "max-w-[80%] rounded-[6px] px-4 py-2",
                msg.role === "user"
                  ? "bg-[rgba(139,0,0,0.2)] border border-[rgba(139,0,0,0.4)]"
                  : "bg-[#111111] border border-[rgba(139,0,0,0.15)]",
              ].join(" ")}
            >
              <p className="whitespace-pre-wrap text-sm text-[#F0F0F0]">
                {msg.content}
              </p>
            </div>
            <span className="mt-1 font-mono text-[10px] text-[#444444]">
              {formatTimestamp(msg.timestamp)}
            </span>
          </div>
        ))}

        {/* Loading bubble */}
        {isLoading && (
          <div className="mb-4 flex flex-col items-start">
            <div className="max-w-[80%] rounded-[6px] border border-[rgba(139,0,0,0.15)] bg-[#111111] px-4 py-2">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#666666] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-[#666666] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-[#666666] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Context selector */}
      <div className="mt-2 flex items-center gap-2 rounded-[4px] border border-[rgba(139,0,0,0.1)] bg-[#0D0D0D] px-3 py-2">
        <span className="font-mono text-xs text-[#666666]">Context:</span>
        <select
          value={selectedProjectId ?? ""}
          onChange={(e) => setSelectedProjectId(e.target.value || null)}
          className="bg-[#111111] border border-[rgba(139,0,0,0.25)] rounded-[4px] px-2 py-1 text-xs font-mono text-[#F0F0F0] focus:outline-none focus:border-[#C41E3A]"
        >
          <option value="">Tanpa project context</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Input area */}
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya sesuatu..."
          disabled={isLoading}
          className="flex-1 rounded-[6px] border border-[rgba(139,0,0,0.25)] bg-[#111111] px-4 py-2 font-mono text-sm text-[#F0F0F0] placeholder-[#444444] focus:border-[#C41E3A] focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={() => void handleSend()}
          disabled={isLoading || input.trim() === ""}
          className="rounded-[6px] bg-[#8B0000] px-4 py-2 font-mono text-xs font-semibold text-[#F0F0F0] transition-colors hover:bg-[#C41E3A] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
