import { load } from "@tauri-apps/plugin-store";

const STORE_FILE = "config.json";

export const ConfigKeys = {
  ANTHROPIC_API_KEY: "anthropic_api_key",
} as const;

type ConfigKey = (typeof ConfigKeys)[keyof typeof ConfigKeys];

let _store: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!_store) _store = await load(STORE_FILE, { autoSave: false, defaults: {} });
  return _store;
}

export async function getConfig(key: ConfigKey): Promise<string | null> {
  const store = await getStore();
  const value = await store.get<string>(key);
  return value ?? null;
}

export async function setConfig(key: ConfigKey, value: string): Promise<void> {
  const store = await getStore();
  try {
    await store.set(key, value);
    await store.save();
  } catch {
    throw new Error(`Failed to save config key "${key}"`);
  }
}

export async function deleteConfig(key: ConfigKey): Promise<boolean> {
  const store = await getStore();
  const existed = (await store.get<string>(key)) !== undefined;
  await store.delete(key);
  if (existed) await store.save();
  return existed;
}
