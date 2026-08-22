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
  env: Pick<ImportMetaEnv, "VITE_D8N_API_URL"> = import.meta.env,
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

  return { apiUrl: raw.replace(/\/+$/, "") };
}
