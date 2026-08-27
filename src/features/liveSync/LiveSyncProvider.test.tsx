import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import * as inAppSound from "./inAppSound.ts";
import { setInAppSoundEnabled } from "./inAppSoundPreference.ts";
import { LIVE_SYNC_NOTIFICATION_MS } from "./liveSyncTiming.ts";

const completeOnboarding = {
  state: "complete",
  next_step: null,
  profile_exists: true,
  profile_complete: true,
  profile_published: true,
  completion: { complete: true, percent: 100, missing: [] },
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
}

function notice(id: string, type: string, payload: Record<string, unknown>) {
  return {
    id,
    type,
    title: "DateZA update",
    body: "Something happened.",
    payload,
    read_at: null,
    created_at: "2026-08-27T12:00:00Z",
  };
}

function actorProfile(id: string, name: string) {
  return {
    id,
    display_name: name,
    age: 28,
    bio: null,
    gender: null,
    pronouns: null,
    country_code: "ZA",
    city: "Cape Town",
    occupation: null,
    job_title: null,
    school_or_institution: null,
    looking_for_text: null,
    height_cm: null,
    body_type: null,
    languages_spoken: [],
    smoking: null,
    drinking: null,
    fitness: null,
    photos: [{ id: `${id}-photo`, position: 0, primary: true, url: "https://example.test/a.jpg", url_expires_in: 60 }],
    options: {},
    verified: false,
    online: false,
    active_today: false,
    new_here: false,
    last_active_at: null,
    distance_km: null,
    compatibility: null,
    prompts: [],
    interests: [],
  };
}

describe("authenticated live sync", () => {
  let playSound: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    playSound = vi.spyOn(inAppSound, "playInAppSound").mockResolvedValue(true);
    vi.spyOn(inAppSound, "unlockInAppAudio").mockImplementation(() => undefined);
    setInAppSoundEnabled(true);
    setBearerToken("opaque-session-token");
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  });

  function install(inbox: { notifications: unknown[]; unread_count: number }[]) {
    let notificationPoll = 0;
    const fetchMock = vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, {
          user_id: 1,
          brand: { slug: "dateza", name: "DateZA" },
          session: { id: 2, expires_at: "2026-12-01T00:00:00Z" },
          identifier: { kind: "email", verified: true, masked_destination: "t••@example.com" },
          verification_required: false,
          verification: { code_dispatched: false, resend_available_in: 0 },
        }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, {
          profile: {
            id: "owner",
            display_name: "Thando",
            options: {},
            status: "active",
            visibility: "visible",
            location: { configured: true, place: null },
          },
          onboarding: completeOnboarding,
        }));
      }
      if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
      if (url.endsWith("/api/v1/profile/location")) {
        return Promise.resolve(jsonResponse(200, { location: { configured: true, place: null } }));
      }
      if (url.endsWith("/api/v1/notifications")) {
        const page = inbox[Math.min(notificationPoll, inbox.length - 1)]!;
        notificationPoll += 1;
        return Promise.resolve(jsonResponse(200, page));
      }
      if (method === "PATCH" && /\/api\/v1\/notifications\/.+\/read$/.test(url)) {
        return Promise.resolve(jsonResponse(200, {
          notification: { ...notice("n-read", "dateza.message_received", {}), read_at: "2026-08-27T12:01:00Z" },
        }));
      }
      if (url.endsWith("/api/v1/profiles/p-inga")) {
        return Promise.resolve(jsonResponse(200, { profile: actorProfile("p-inga", "Inga") }));
      }
      if (url.endsWith("/api/v1/profiles/p-mason")) {
        return Promise.resolve(jsonResponse(200, { profile: actorProfile("p-mason", "Mason") }));
      }
      if (url.endsWith("/api/v1/discovery")) {
        return Promise.resolve(jsonResponse(200, {
          profiles: [],
          next_cursor: null,
          selection: { allocation_date: "2026-08-27", daily_limit: 10, count: 0, finalized: true, refreshes_at: "2026-08-28T00:00:00+02:00" },
        }));
      }
      if (url.endsWith("/api/v1/conversations")) {
        return Promise.resolve(jsonResponse(200, {
          conversations: [{
            id: "c-live",
            match_id: "m-live",
            status: "active",
            created_at: "2026-08-26T08:00:00Z",
            profile: actorProfile("p-inga", "Inga"),
            last_message: { id: "preview-1", sender_id: "p-inga", body: "Hi", created_at: "2026-08-26T09:00:00Z" },
          }],
          next_cursor: null,
        }));
      }
      if (url.endsWith("/api/v1/conversations/c-live/messages")) {
        return Promise.resolve(jsonResponse(200, {
          messages: [{ id: "msg-1", conversation_id: "c-live", sender_id: "p-inga", body: "Hi", created_at: "2026-08-26T09:00:00Z" }],
          next_cursor: null,
        }));
      }
      if (url.endsWith("/api/v1/openers")) return Promise.resolve(jsonResponse(200, { openers: [], next_cursor: null }));
      if (url.endsWith("/api/v1/matches")) return Promise.resolve(jsonResponse(200, { matches: [], next_cursor: null }));
      if (url.includes("/api/v1/likes/incoming") || url.includes("/api/v1/likes/outgoing")) {
        return Promise.resolve(jsonResponse(200, { likes: [], next_cursor: null }));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(jsonResponse(200, {
          configuration: {
            identity_fields: [],
            profile_fields: [],
            preference_fields: [],
            collections: [],
            option_groups: [],
            prompts: [],
            openers: [],
          },
          onboarding: completeOnboarding,
        }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });
    return { fetchMock, polls: () => notificationPoll };
  }

  function renderApp(path = "/discover") {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  }

  async function flush(ms = 0) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  }

  it("does not toast the first notification snapshot", async () => {
    install([{
      unread_count: 1,
      notifications: [notice("n-hist", "dateza.like_received", { actor: { profile_id: "p-inga" }, target: { type: "profile", id: "owner" } })],
    }]);
    renderApp();
    await flush(0);
    expect(screen.queryByText(/liked you/i)).not.toBeInTheDocument();
    await flush(LIVE_SYNC_NOTIFICATION_MS);
    expect(screen.queryByText(/liked you/i)).not.toBeInTheDocument();
    expect(playSound).not.toHaveBeenCalled();
  });

  it("toasts a new message once, increments the bell, and navigates to the conversation", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const empty = { notifications: [], unread_count: 0 };
    const incoming = {
      unread_count: 1,
      notifications: [
        notice("n-msg", "dateza.message_received", { actor: { profile_id: "p-inga" }, target: { type: "conversation", id: "c-live" } }),
      ],
    };
    install([empty, incoming, incoming]);
    renderApp();
    await flush(0);
    expect(screen.queryByText(/inga sent you a message/i)).not.toBeInTheDocument();

    await flush(LIVE_SYNC_NOTIFICATION_MS);
    expect(await screen.findByText("Inga sent you a message")).toBeInTheDocument();
    expect(screen.getByText("View chat")).toBeInTheDocument();
    expect(screen.getByLabelText("1 unread notifications")).toBeInTheDocument();
    expect(playSound).toHaveBeenCalledTimes(1);

    await flush(LIVE_SYNC_NOTIFICATION_MS);
    expect(screen.getAllByText("Inga sent you a message")).toHaveLength(1);
    expect(playSound).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("link", { name: /inga sent you a message/i }));
    expect(await screen.findByRole("heading", { name: "Chats" })).toBeInTheDocument();
    expect(screen.getAllByText("Hi").length).toBeGreaterThan(0);
  });

  it("navigates like, match, and opener toasts from server targets", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const empty = { notifications: [], unread_count: 0 };
    install([
      empty,
      {
        unread_count: 3,
        notifications: [
          notice("n-like", "dateza.like_received", { actor: { profile_id: "p-inga" }, target: { type: "profile", id: "owner" } }),
        ],
      },
    ]);
    const first = renderApp();
    await flush(0);
    await flush(LIVE_SYNC_NOTIFICATION_MS);
    expect(await screen.findByText("Inga liked you")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /inga liked you/i })).toHaveAttribute("href", "/likes?tab=liked_you");
    await user.click(screen.getByRole("link", { name: /inga liked you/i }));
    expect(await screen.findByRole("heading", { level: 1, name: /likes/i })).toBeInTheDocument();
    first.unmount();

    install([
      empty,
      {
        unread_count: 1,
        notifications: [
          notice("n-match", "dateza.match_created", { actor: { profile_id: "p-inga" }, target: { type: "match", id: "m1" } }),
        ],
      },
    ]);
    const second = renderApp();
    await flush(0);
    await flush(LIVE_SYNC_NOTIFICATION_MS);
    expect(await screen.findByText("It’s a match!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /it’s a match/i })).toHaveAttribute("href", "/profile/p-inga");
    await user.click(screen.getByRole("link", { name: /it’s a match/i }));
    expect(await screen.findByRole("heading", { level: 1, name: /inga/i })).toBeInTheDocument();
    second.unmount();

    install([
      empty,
      {
        unread_count: 1,
        notifications: [
          notice("n-opener", "dateza.opener_received", { actor: { profile_id: "p-mason" }, target: { type: "opener", id: "o1" } }),
        ],
      },
    ]);
    renderApp();
    await flush(0);
    await flush(LIVE_SYNC_NOTIFICATION_MS);
    expect(await screen.findByText("Mason sent you an opener")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /mason sent you an opener/i })).toHaveAttribute("href", "/chats");
    await user.click(screen.getByRole("link", { name: /mason sent you an opener/i }));
    expect(await screen.findByRole("heading", { name: "Chats" })).toBeInTheDocument();
  });

  it("does not play sound when in-app sounds are off", async () => {
    setInAppSoundEnabled(false);
    playSound.mockImplementation(async () => false);
    install([
      { notifications: [], unread_count: 0 },
      {
        unread_count: 1,
        notifications: [notice("n-like", "dateza.like_received", { actor: { profile_id: "p-inga" }, target: { type: "profile", id: "owner" } })],
      },
    ]);
    renderApp();
    await flush(0);
    await flush(LIVE_SYNC_NOTIFICATION_MS);
    expect(await screen.findByText("Inga liked you")).toBeInTheDocument();
    expect(playSound).toHaveBeenCalled();
    await expect(playSound.mock.results[playSound.mock.results.length - 1]?.value).resolves.toBe(false);
  });

  it("keeps the page when audio playback rejects", async () => {
    playSound.mockRejectedValue(new Error("blocked"));
    install([
      { notifications: [], unread_count: 0 },
      {
        unread_count: 1,
        notifications: [notice("n-like", "dateza.like_received", { actor: { profile_id: "p-inga" }, target: { type: "profile", id: "owner" } })],
      },
    ]);
    renderApp();
    await flush(0);
    await flush(LIVE_SYNC_NOTIFICATION_MS);
    expect(await screen.findByText("Inga liked you")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /discover/i })).toBeInTheDocument();
  });

  it("does not toast a message for the conversation already on screen", async () => {
    install([
      { notifications: [], unread_count: 0 },
      {
        unread_count: 1,
        notifications: [
          notice("n-msg", "dateza.message_received", { actor: { profile_id: "p-inga" }, target: { type: "conversation", id: "c-live" } }),
        ],
      },
    ]);
    renderApp("/chats?conversation=c-live");
    await flush(0);
    expect(screen.getAllByText("Hi").length).toBeGreaterThan(0);
    await flush(LIVE_SYNC_NOTIFICATION_MS);
    expect(screen.queryByText(/inga sent you a message/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("1 unread notifications")).toBeInTheDocument();
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  it("keeps the page when a poll fails and recovers on the next tick", async () => {
    let notificationPoll = 0;
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, {
          user_id: 1,
          brand: { slug: "dateza", name: "DateZA" },
          session: { id: 2, expires_at: "2026-12-01T00:00:00Z" },
          identifier: { kind: "email", verified: true, masked_destination: "t••@example.com" },
          verification_required: false,
          verification: { code_dispatched: false, resend_available_in: 0 },
        }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, {
          profile: {
            id: "owner",
            display_name: "Thando",
            options: {},
            status: "active",
            visibility: "visible",
            location: { configured: true, place: null },
          },
          onboarding: completeOnboarding,
        }));
      }
      if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
      if (url.endsWith("/api/v1/discovery")) {
        return Promise.resolve(jsonResponse(200, {
          profiles: [],
          next_cursor: null,
          selection: { allocation_date: "2026-08-27", daily_limit: 10, count: 0, finalized: true, refreshes_at: "2026-08-28T00:00:00+02:00" },
        }));
      }
      if (url.endsWith("/api/v1/notifications")) {
        notificationPoll += 1;
        if (notificationPoll === 2) return Promise.resolve(jsonResponse(500, { error: "server_error" }));
        if (notificationPoll === 1) return Promise.resolve(jsonResponse(200, { notifications: [], unread_count: 0 }));
        return Promise.resolve(jsonResponse(200, {
          unread_count: 1,
          notifications: [notice("n-like", "dateza.like_received", { actor: { profile_id: "p-inga" }, target: { type: "profile", id: "owner" } })],
        }));
      }
      if (url.endsWith("/api/v1/profiles/p-inga")) {
        return Promise.resolve(jsonResponse(200, { profile: actorProfile("p-inga", "Inga") }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });
    renderApp();
    await flush(0);
    await flush(LIVE_SYNC_NOTIFICATION_MS);
    expect(screen.queryByText(/connection failed/i)).not.toBeInTheDocument();
    await flush(LIVE_SYNC_NOTIFICATION_MS * 2);
    expect(await screen.findByText("Inga liked you")).toBeInTheDocument();
  });

  it("refreshes immediately when the tab becomes visible again", async () => {
    let hidden = false;
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
    const { polls } = install([{ notifications: [], unread_count: 0 }]);
    renderApp();
    await flush(0);
    const afterFirst = polls();
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    await flush(LIVE_SYNC_NOTIFICATION_MS * 3);
    expect(polls()).toBe(afterFirst);
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    await flush(0);
    expect(polls()).toBeGreaterThan(afterFirst);
  });

  it("stops polling after logout unmounts the authenticated shell", async () => {
    const { polls } = install([{ notifications: [], unread_count: 0 }]);
    const view = renderApp();
    await flush(0);
    const before = polls();
    view.unmount();
    await flush(LIVE_SYNC_NOTIFICATION_MS * 4);
    expect(polls()).toBe(before);
  });
});
