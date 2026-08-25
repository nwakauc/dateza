export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export type AppConfig = {
  apiUrl: string;
};

export function readAppConfig(
  env: Pick<ImportMetaEnv, "VITE_D8N_API_URL" | "MODE"> = import.meta.env,
): AppConfig {
  const raw = env.VITE_D8N_API_URL?.trim();
  if (!raw) {
    throw new ConfigError("VITE_D8N_API_URL is not set.");
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ConfigError("VITE_D8N_API_URL must be an absolute URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ConfigError("VITE_D8N_API_URL must use http or https.");
  }

  // `vite dev` only: fetch same-origin (relative) paths instead of the
  // absolute upstream URL. vite.config.ts proxies `/api` to
  // VITE_D8N_API_URL with changeOrigin so the browser's request/response
  // cycle stays on localhost:5173 throughout — D8N's browser-session cookie
  // is SameSite=Lax in dev/test and will not reliably survive a genuinely
  // cross-site localhost:5173 -> API-host round trip. Production keeps the
  // absolute URL; that topology is a deployment-time concern (see README).
  if (env.MODE === "development") {
    return { apiUrl: "" };
  }

  return { apiUrl: raw.replace(/\/+$/, "") };
}
