import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { setCsrfToken } from "../lib/api/csrfStore.ts";
import { setBearerToken } from "../lib/api/tokenStore.ts";
import { setUnauthorizedListener } from "../lib/api/client.ts";
import { resetPlaceSearchIndex } from "../lib/api/places.ts";

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  setBearerToken(undefined);
  setCsrfToken(undefined);
  setUnauthorizedListener(undefined);
  window.localStorage.clear();
  if (typeof URL.createObjectURL !== "function") {
    URL.createObjectURL = () => "blob:dateza-test";
  }
  if (typeof URL.revokeObjectURL !== "function") {
    URL.revokeObjectURL = () => undefined;
  }
  if (typeof ResizeObserver === "undefined") {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(unauthorizedResponse())),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setBearerToken(undefined);
  setCsrfToken(undefined);
  setUnauthorizedListener(undefined);
  resetPlaceSearchIndex();
  window.localStorage.clear();
  document.title = "DateZA — Meet someone who chooses you.";
});
