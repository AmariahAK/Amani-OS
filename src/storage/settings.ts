const KEYS_KEY = "amani-os:provider-keys";
const SETTINGS_KEY = "amani-os:settings";

export interface AppSettings {
  provider: string;
  modelId: string;
  thinkingLevel: "off" | "low" | "medium" | "high";
  timezone: string;
  proxyEnabled: boolean;
  proxyUrl: string;
}

const defaultSettings: AppSettings = {
  provider: "google",
  modelId: "gemini-2.0-flash",
  thinkingLevel: "medium",
  timezone: "Africa/Nairobi",
  proxyEnabled: false,
  proxyUrl: "https://corsproxy.io/?",
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as AppSettings & { apiKey?: string };
    // Migrate legacy single apiKey into per-provider storage (one-time)
    if (parsed.apiKey?.trim()) {
      const keys = loadProviderKeys();
      const provider = parsed.provider || defaultSettings.provider;
      if (!keys[provider]) {
        keys[provider] = parsed.apiKey.trim();
        saveProviderKeys(keys);
      }
      const { apiKey: _removed, ...rest } = parsed;
      const cleaned = { ...defaultSettings, ...rest };
      saveSettings(cleaned);
      return cleaned;
    }
    return { ...defaultSettings, ...parsed };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadProviderKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEYS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProviderKeys(keys: Record<string, string>): void {
  localStorage.setItem(KEYS_KEY, JSON.stringify(keys));
}

/** Returns the API key for exactly this provider — never falls back to another provider's key. */
export function getApiKey(provider: string): string | undefined {
  const keys = loadProviderKeys();
  const key = keys[provider]?.trim();
  return key || undefined;
}

export function setProviderKey(provider: string, apiKey: string): void {
  const keys = loadProviderKeys();
  keys[provider] = apiKey.trim();
  saveProviderKeys(keys);
}

export function hasApiKeyForProvider(provider: string): boolean {
  return Boolean(getApiKey(provider));
}

export function isAppConfigured(): boolean {
  const s = loadSettings();
  return hasApiKeyForProvider(s.provider) && Boolean(s.modelId);
}
