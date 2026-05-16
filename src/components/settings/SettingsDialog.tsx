import { useEffect, useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { getModels, getProviders } from "@mariozechner/pi-ai";
import { useAppStore } from "../../store/appStore";
import {
  hasApiKeyForProvider,
  loadProviderKeys,
  loadSettings,
  saveProviderKeys,
  saveSettings,
  type AppSettings,
} from "../../storage/settings";
import { getStorageSizeBytes } from "../../storage/chatSessions";
import { BROWSER_PROVIDERS, PROVIDER_LABELS } from "../../constants/providers";

export function SettingsDialog() {
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const settingsHint = useAppStore((s) => s.settingsHint);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const setSettingsHint = useAppStore((s) => s.setSettingsHint);
  const applySettings = useAppStore((s) => s.applySettings);

  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [keys, setKeys] = useState<Record<string, string>>(() => loadProviderKeys());
  const [modelSearch, setModelSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settingsOpen) {
      setSettings(loadSettings());
      setKeys(loadProviderKeys());
      setModelSearch("");
      setError(null);
    }
  }, [settingsOpen]);

  const allProviders = useMemo(() => {
    try {
      return getProviders().filter((p) => BROWSER_PROVIDERS.includes(p));
    } catch {
      return BROWSER_PROVIDERS;
    }
  }, []);

  const models = useMemo(() => {
    try {
      const list = getModels(settings.provider as Parameters<typeof getModels>[0]);
      const q = modelSearch.toLowerCase();
      return q
        ? list.filter((m) => m.id.toLowerCase().includes(q) || (m.name ?? "").toLowerCase().includes(q))
        : list;
    } catch {
      return [];
    }
  }, [settings.provider, modelSearch]);

  // When provider changes, pick first model if current id is invalid
  useEffect(() => {
    if (!models.length) return;
    if (!models.some((m) => m.id === settings.modelId)) {
      setSettings((s) => ({ ...s, modelId: models[0].id }));
    }
  }, [settings.provider, models, settings.modelId]);

  if (!settingsOpen) return null;

  const currentKey = keys[settings.provider] ?? "";
  const storageMb = (getStorageSizeBytes() / (1024 * 1024)).toFixed(2);

  const save = () => {
    const trimmedKey = currentKey.trim();
    if (!trimmedKey) {
      setError(`Enter an API key for ${PROVIDER_LABELS[settings.provider] ?? settings.provider}.`);
      return;
    }
    if (!settings.modelId) {
      setError("Select a model.");
      return;
    }

    const nextKeys = { ...keys, [settings.provider]: trimmedKey };
    saveSettings(settings);
    saveProviderKeys(nextKeys);
    applySettings(settings);
    setKeys(nextKeys);
    setError(null);
    setSettingsHint(null);
    setSettingsOpen(false);
  };

  const onProviderChange = (provider: string) => {
    setSettings((s) => ({ ...s, provider }));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl shadow-2xl"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
            Setup
          </h2>
          <button
            type="button"
            onClick={() => {
              setSettingsOpen(false);
              setSettingsHint(null);
              setError(null);
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {(settingsHint || error) && (
            <p
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: "var(--color-clause)", color: "var(--color-text)" }}
            >
              {error ?? settingsHint}
            </p>
          )}

          {/* 1. Provider */}
          <section>
            <label className="block">
              <span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                1. Provider
              </span>
              <select
                className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
                value={settings.provider}
                onChange={(e) => onProviderChange(e.target.value)}
              >
                {allProviders.map((p) => (
                  <option key={p} value={p}>
                    {PROVIDER_LABELS[p] ?? p}
                    {hasApiKeyForProvider(p) ? " ✓" : ""}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {/* 2. API key (selected provider only) */}
          <section>
            <label className="block">
              <span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                2. API key
              </span>
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-muted)" }}>
                Stored locally per provider — {PROVIDER_LABELS[settings.provider] ?? settings.provider} only.
                Other providers use their own keys.
              </p>
              <input
                type="password"
                className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
                value={currentKey}
                onChange={(e) => {
                  setKeys({ ...keys, [settings.provider]: e.target.value });
                  setError(null);
                }}
                placeholder={`${PROVIDER_LABELS[settings.provider] ?? settings.provider} API key`}
                autoComplete="off"
              />
            </label>
          </section>

          {/* 3. Model */}
          <section>
            <span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
              3. Model
              {models.length > 0 && (
                <span className="ml-2 font-normal" style={{ color: "var(--color-muted)" }}>
                  ({models.length} available)
                </span>
              )}
            </span>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-2.5 opacity-40" size={16} />
              <input
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
                placeholder="Search models…"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
              />
            </div>
            <ul
              className="mt-2 max-h-40 overflow-y-auto rounded-lg border"
              style={{ borderColor: "var(--color-border)" }}
            >
              {models.length === 0 ? (
                <li className="px-3 py-2 text-sm" style={{ color: "var(--color-muted)" }}>
                  No models for this provider.
                </li>
              ) : (
                models.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-black/5"
                      style={{
                        background: settings.modelId === m.id ? "var(--color-clause)" : undefined,
                      }}
                      onClick={() => {
                        setSettings({ ...settings, modelId: m.id });
                        setError(null);
                      }}
                    >
                      {m.name || m.id}
                    </button>
                  </li>
                ))
              )}
            </ul>
            <label className="mt-3 block">
              <span className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>
                Thinking level
              </span>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
                value={settings.thinkingLevel}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    thinkingLevel: e.target.value as AppSettings["thinkingLevel"],
                  })
                }
              >
                <option value="off">Off</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </section>

          {/* 4. Proxy (optional) */}
          <section>
            <span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
              4. CORS proxy (optional)
            </span>
            <label className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.proxyEnabled}
                onChange={(e) => setSettings({ ...settings, proxyEnabled: e.target.checked })}
              />
              <span className="text-sm">Enable proxy for browser API calls</span>
            </label>
            {settings.proxyEnabled && (
              <input
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
                value={settings.proxyUrl}
                onChange={(e) => setSettings({ ...settings, proxyUrl: e.target.value })}
                placeholder="https://corsproxy.io/?"
              />
            )}
            <p className="mt-2 text-xs" style={{ color: "var(--color-muted)" }}>
              Local storage: {storageMb} MB (limit ~5 MB)
            </p>
          </section>
        </div>

        <div className="border-t px-5 py-4" style={{ borderColor: "var(--color-border)" }}>
          <button
            type="button"
            onClick={save}
            disabled={!currentKey.trim() || !settings.modelId}
            className="w-full rounded-xl py-2.5 font-medium text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            Save & start
          </button>
        </div>
      </div>
    </div>
  );
}

