import { load } from "@tauri-apps/plugin-store";

const STORE_FILE = "config.json";

export const ConfigKeys = {
  ANTHROPIC_API_KEY: "anthropic_api_key",
} as const;

export async function getConfig(key: string): Promise<string | null> {
  const store = await load(STORE_FILE, { autoSave: false, defaults: {} });
  const value = await store.get<string>(key);
  return value ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const store = await load(STORE_FILE, { autoSave: false, defaults: {} });
  await store.set(key, value);
  await store.save();
}

export async function deleteConfig(key: string): Promise<void> {
  const store = await load(STORE_FILE, { autoSave: false, defaults: {} });
  await store.delete(key);
  await store.save();
}
