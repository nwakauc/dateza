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

  // Media uploads PUT through XMLHttpRequest, because fetch cannot report
  // request-body progress and members need to see a photo moving. jsdom has
  // no usable XHR transport, so route it through whatever `fetch` the test
  // has stubbed — the upload URL is then mocked exactly like every other
  // request, and progress callbacks still fire.
  class UploadXhrStub {
    status = 0;
    timeout = 0;
    withCredentials = false;
    readonly upload: { onprogress?: (event: ProgressEvent) => void } = {};
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    ontimeout: (() => void) | null = null;
    onabort: (() => void) | null = null;
    #method = "GET";
    #url = "";
    #headers: Record<string, string> = {};

    open(method: string, url: string): void {
      this.#method = method;
      this.#url = url;
    }

    setRequestHeader(name: string, value: string): void {
      this.#headers[name] = value;
    }

    send(body?: BodyInit | null): void {
      const total =
        body instanceof ArrayBuffer ? body.byteLength : body instanceof Blob ? body.size : 0;
      void Promise.resolve(
        (globalThis.fetch as typeof fetch)(this.#url, {
          method: this.#method,
          headers: this.#headers,
          body: body as BodyInit,
        }),
      ).then(
        (response) => {
          this.status = response.status;
          this.upload.onprogress?.({
            lengthComputable: true,
            loaded: total,
            total,
          } as ProgressEvent);
          this.onload?.();
        },
        () => {
          this.status = 0;
          this.onerror?.();
        },
      );
    }

    abort(): void {
      this.onabort?.();
    }
  }
  vi.stubGlobal("XMLHttpRequest", UploadXhrStub);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setBearerToken(undefined);
  setCsrfToken(undefined);
  setUnauthorizedListener(undefined);
  resetPlaceSearchIndex();
  window.localStorage.clear();
  document.title = "DateZA — Dating in South Africa";
});
