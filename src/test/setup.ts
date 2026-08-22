import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { setBearerToken } from "../lib/api/tokenStore.ts";
import { setUnauthorizedListener } from "../lib/api/client.ts";

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  setBearerToken(undefined);
  setUnauthorizedListener(undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(unauthorizedResponse())),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setBearerToken(undefined);
  setUnauthorizedListener(undefined);
  document.title = "DateZA — Meet someone who gets you.";
});
