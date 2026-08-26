import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiTarget = env.VITE_D8N_API_URL;

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(env.npm_package_version ?? "0.0.1"),
    },
    server: {
      host: "localhost",
      port: 5173,
      strictPort: true,
      // Browser API traffic is always same-origin. This proxy mirrors the
      // hosted Vercel rewrite; changeOrigin preserves D8N's upstream
      // host-based brand resolution without exposing that host to browsers.
      //
      // Known gap (see docs/decisions — Safari registration redirect
      // investigation): `Secure` cookies require a genuine TLS connection
      // to be stored. Chromium grants `http://localhost` a non-standard
      // exception; WebKit (Safari) does not, and silently drops the
      // cookie, so a member who just registered is bounced back to
      // sign-in on the next request. The fix is to serve this dev server
      // over HTTPS (`@vitejs/plugin-basic-ssl`, gated to `command ===
      // "serve"` only), but D8N's browser-session origin allowlist does
      // not yet include `https://localhost:5173` — enabling it today
      // returns 403 `browser_session_origin_not_allowed` for every
      // browser, not just Safari. Do not enable this locally until the
      // backend allowlists the HTTPS origin.
      proxy: apiTarget
        ? {
            "/api": {
              target: apiTarget,
              changeOrigin: true,
            },
          }
        : undefined,
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      restoreMocks: true,
    },
  };
});
