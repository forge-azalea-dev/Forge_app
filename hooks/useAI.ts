import { useState, useEffect } from "react";
import { getConfig, ConfigKeys } from "@/lib/config";

type AnthropicMessage =
  | { type: "text"; text: string }
  | { type: string };

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
      return (first as { type: "text"; text: string }).text;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err) || "Gagal generate respons AI.";
      setError(message);
      return "";
    } finally {
      setIsLoading(false);
    }
  };

  return { isConfigured, isLoading, error, generate };
}
