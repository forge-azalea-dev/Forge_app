import { useRef, useState } from "react";
import { useAI } from "@/hooks/useAI";
import {
  ProjectRepo,
  PrdRepo,
  SessionRepo,
  PHASE_LABELS,
} from "@/lib/database";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

const MAX_HISTORY_MESSAGES = 10;
const MAX_CONTEXT_SESSIONS = 3;

async function buildContext(projectId: string | null): Promise<string> {
  const parts: string[] = [];

  if (projectId !== null) {
    const project = await ProjectRepo.getById(projectId);
    if (project === null) {
      parts.push("Tidak ada data project.");
    } else {
      const prd = await PrdRepo.getByProject(projectId);
      parts.push(
        [
          `Project: ${project.name} (${project.status})`,
          `Stack: ${project.stack ?? "—"}`,
          `Phase: ${PHASE_LABELS[project.phase]}`,
          `Deskripsi: ${project.description ?? "—"}`,
          `PRD: ${prd ? prd.title + "\n" + (prd.content ?? "") : "Belum ada PRD"}`,
        ].join("\n"),
      );
    }
  }

  const sessions = await SessionRepo.getAll();
  const recentSessions = sessions.slice(0, MAX_CONTEXT_SESSIONS);
  if (recentSessions.length === 0) {
    parts.push("Tidak ada session log.");
  } else {
    const sessionLines = recentSessions
      .map((s) => `[${s.title}] ${s.summary ?? "—"}`)
      .join("\n");
    parts.push(sessionLines);
  }

  return parts.join("\n\n");
}

export function useChat(): UseChatReturn {
  const {
    isConfigured,
    isLoading,
    error: aiError,
    generate,
  } = useAI();

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [errorCleared, setErrorCleared] = useState(false);

  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;
  const generatingRef = useRef(false);

  const sendMessage = async (content: string): Promise<void> => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    try {
      setErrorCleared(false);
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Build conversation history from last MAX_HISTORY_MESSAGES messages before this new one
      const historyMessages = messagesRef.current.slice(-MAX_HISTORY_MESSAGES);
      const conversationHistory = historyMessages
        .map((m) => (m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`))
        .join("\n");

      const context = await buildContext(selectedProjectId);

      const systemPrompt = `Kamu adalah AI assistant untuk developer bernama Tuan Muda.\nKamu punya akses ke data workflow Forge miliknya.\n\nDATA CONTEXT:\n${context}\n\nJawab dalam Bahasa Indonesia. Ringkas tapi informatif.\nKalau ditanya tentang project, gunakan data di atas.\nKalau tidak ada context yang relevan, jawab berdasarkan pengetahuan umum.`;

      const userPrompt =
        conversationHistory.length > 0
          ? `${conversationHistory}\n\nUser: ${content}`
          : content;

      const result = await generate(systemPrompt, userPrompt);

      if (result !== "") {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } finally {
      generatingRef.current = false;
    }
  };

  const clearChat = (): void => {
    setMessages([]);
    setErrorCleared(true);
  };

  return {
    messages,
    isLoading,
    error: errorCleared ? null : aiError,
    isConfigured,
    selectedProjectId,
    setSelectedProjectId,
    sendMessage,
    clearChat,
  };
}
