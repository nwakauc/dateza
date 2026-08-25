import { describe, expect, it } from "vitest";
import { ConfigError, readAppConfig } from "./config.ts";

/**
 * `vite dev` (MODE: "development") must resolve to a relative apiUrl so
 * requests go through the same-origin proxy in vite.config.ts — that is
 * what makes D8N's SameSite=Lax browser-session cookie survive locally.
 * Every other mode (test, production) keeps the real absolute API URL.
 */
describe("readAppConfig", () => {
  it("uses the absolute API URL outside of vite dev", () => {
    expect(
      readAppConfig({ VITE_D8N_API_URL: "https://dateza-staging-api.d8n.tech/", MODE: "production" }),
    ).toEqual({ apiUrl: "https://dateza-staging-api.d8n.tech" });

    expect(
      readAppConfig({ VITE_D8N_API_URL: "https://dateza.test", MODE: "test" }),
    ).toEqual({ apiUrl: "https://dateza.test" });
  });

  it("resolves to a relative apiUrl under vite dev, for the same-origin proxy", () => {
    expect(
      readAppConfig({ VITE_D8N_API_URL: "https://dateza-staging-api.d8n.tech", MODE: "development" }),
    ).toEqual({ apiUrl: "" });
  });

  it("still requires a valid VITE_D8N_API_URL even in dev mode", () => {
    expect(() => readAppConfig({ VITE_D8N_API_URL: undefined, MODE: "development" })).toThrow(ConfigError);
    expect(() => readAppConfig({ VITE_D8N_API_URL: "dateza.test", MODE: "development" })).toThrow(ConfigError);
    expect(() => readAppConfig({ VITE_D8N_API_URL: "ftp://dateza.test", MODE: "development" })).toThrow(
      ConfigError,
    );
  });
});
