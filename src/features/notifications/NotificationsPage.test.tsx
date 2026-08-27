import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import { setBearerToken } from "../../lib/api/tokenStore.ts";

const completeOnboarding = {
  state: "complete",
  next_step: null,
  profile_exists: true,
  profile_complete: true,
  profile_published: true,
  completion: { complete: true, percent: 100, missing: [] },
};

function jsonResponse(status: number, body?: unknown): Response {
  return body === undefined
    ? new Response(null, { status })
    : new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
}

function publicProfile(id: string, displayName: string) {
  return {
    id,
    display_name: displayName,
    age: 27,
    bio: null,
    gender: "female",
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
    photos: [],
    options: {},
    verified: false,
    online: false,
    active_today: false,
    new_here: false,
    last_active_at: null,
    distance_km: null,
    hook_tonight_active: false,
    hook_state: "unavailable",
    prompts: [],
    interests: [],
    compatibility: null,
  };
}

function installHandler(
  initialNotifications: ProductNotification[],
  listFails = false,
  extra?: (url: string, method: string, init?: RequestInit) => Response | undefined,
) {
  let notifications = initialNotifications;
  let prefs = { product_email_enabled: true, push_enabled: false };
  vi.mocked(fetch).mockImplementation((input, init) => {
    const url = requestUrl(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const extraResponse = extra?.(url, method, init);
    if (extraResponse) return Promise.resolve(extraResponse);
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
        profile: { id: "owner", display_name: "Thando", options: {}, status: "active", visibility: "visible", location: { configured: true, place: null } },
        onboarding: completeOnboarding,
      }));
    }
    if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
    if (url.endsWith("/api/v1/notifications/preferences") && method === "GET") {
      return Promise.resolve(jsonResponse(200, { preferences: prefs }));
    }
    if (url.endsWith("/api/v1/notifications/preferences") && method === "PATCH") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { product_email_enabled?: boolean; push_enabled?: boolean };
      prefs = {
        product_email_enabled: body.product_email_enabled ?? prefs.product_email_enabled,
        push_enabled: body.push_enabled ?? prefs.push_enabled,
      };
      return Promise.resolve(jsonResponse(200, { preferences: prefs }));
    }
    if (url.endsWith("/api/v1/notifications") && method === "GET") {
      if (listFails) return Promise.resolve(jsonResponse(503, { error: "unavailable" }));
      return Promise.resolve(jsonResponse(200, {
        notifications,
        unread_count: notifications.filter((item) => item.read_at === null).length,
      }));
    }
    if (url.includes("/api/v1/notifications/") && url.endsWith("/read") && method === "PATCH") {
      const segments = url.split("/");
      const id = decodeURIComponent(segments[segments.length - 2] ?? "");
      const readAt = "2026-08-26T10:00:00Z";
      notifications = notifications.map((item) => item.id === id ? { ...item, read_at: readAt } : item);
      return Promise.resolve(jsonResponse(200, { notification: notifications.find((item) => item.id === id) }));
    }
    if (url.endsWith("/api/v1/notifications/read_all") && method === "POST") {
      notifications = notifications.map((item) => ({ ...item, read_at: item.read_at ?? "2026-08-26T10:00:00Z" }));
      return Promise.resolve(jsonResponse(200, { marked_read: notifications.length, unread_count: 0 }));
    }
    return Promise.resolve(jsonResponse(404, { error: "not_found" }));
  });
}

function renderNotifications() {
  return render(<MemoryRouter initialEntries={["/notifications"]}><App /></MemoryRouter>);
}

const unreadNotification: ProductNotification = {
  id: "notice-1",
  type: "dateza.welcome",
  title: "Welcome to DateZA",
  body: "Your account is ready. Complete your profile and start meeting people worth meeting.",
  payload: {},
  read_at: null,
  created_at: new Date().toISOString(),
};

const likeNotification: ProductNotification = {
  id: "like-1",
  type: "dateza.like_received",
  title: "Someone likes you",
  body: "A member liked your profile.",
  payload: {
    actor: { profile_id: "p1" },
    target: { type: "profile", id: "p1" },
  },
  read_at: null,
  created_at: new Date().toISOString(),
};

function profileExtra(id: string, name: string, missing = false) {
  return (url: string) => {
    if (url.endsWith(`/api/v1/profiles/${id}`)) {
      return missing
        ? jsonResponse(404, { error: "profile_unavailable" })
        : jsonResponse(200, { profile: publicProfile(id, name) });
    }
    if (url.endsWith("/api/v1/profile/configuration")) {
      return jsonResponse(200, {
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
      });
    }
    if (url.endsWith("/api/v1/conversations")) {
      return jsonResponse(200, { conversations: [], next_cursor: null });
    }
    return undefined;
  };
}

describe("Notifications Centre", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    setBearerToken("opaque-token");
  });

  it("loads authoritative notifications and marks one as read", async () => {
    const user = userEvent.setup();
    installHandler([unreadNotification]);
    renderNotifications();

    expect(await screen.findByText("Welcome to DateZA")).toBeInTheDocument();
    const notice = screen.getByRole("button", { name: /welcome to dateza/i });
    expect(notice).toHaveClass("notification-item--unread");
    expect(await screen.findByLabelText("1 unread notifications")).toBeInTheDocument();

    await user.click(notice);
    await waitFor(() => expect(notice).not.toHaveClass("notification-item--unread"));
    await waitFor(() => expect(screen.queryByLabelText("1 unread notifications")).not.toBeInTheDocument());
  });

  it("marks all notifications as read through D8N", async () => {
    const user = userEvent.setup();
    installHandler([
      unreadNotification,
      { ...unreadNotification, id: "notice-2", title: "Another DateZA update" },
    ]);
    renderNotifications();

    await user.click(await screen.findByRole("button", { name: "Mark all read" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Mark all read" })).not.toBeInTheDocument());
    expect(screen.queryAllByText("Unread")).toHaveLength(0);
  });

  it("shows a useful empty state", async () => {
    installHandler([]);
    renderNotifications();

    expect(await screen.findByText("You’re all caught up")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Discover people" })).toHaveAttribute("href", "/discover");
  });

  it("keeps the shell available when notifications fail", async () => {
    installHandler([], true);
    renderNotifications();

    expect(await screen.findByText("We couldn’t load your notifications")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Main" }).length).toBeGreaterThan(0);
  });

  it("enriches a like from profile detail and opens that profile after marking it read", async () => {
    const user = userEvent.setup();
    installHandler([likeNotification], false, profileExtra("p1", "Maya"));
    renderNotifications();

    const notice = await screen.findByRole("button", { name: /maya liked your profile/i });
    expect(screen.getByText("Maya, 27, Cape Town")).toBeInTheDocument();
    await user.click(notice);
    expect(await screen.findByRole("heading", { level: 1, name: /maya/i })).toBeInTheDocument();
  });

  it("handles a like notification whose profile target is no longer available", async () => {
    const user = userEvent.setup();
    installHandler(
      [{ ...likeNotification, id: "like-stale", payload: { actor: { profile_id: "gone" }, target: { type: "profile", id: "gone" } } }],
      false,
      profileExtra("gone", "Maya", true),
    );
    renderNotifications();

    await user.click(await screen.findByRole("button", { name: /someone likes you/i }));
    expect(await screen.findByText("This profile is not available.")).toBeInTheDocument();
  });

  it("filters the inbox by likes, matches, messages, and activity", async () => {
    const user = userEvent.setup();
    installHandler(
      [
        unreadNotification,
        likeNotification,
        {
          id: "match-1",
          type: "dateza.match_created",
          title: "It's a match!",
          body: "You have a new match on DateZA. Say hello.",
          payload: { actor: { profile_id: "p2" }, target: { type: "match", id: "m1" } },
          read_at: null,
          created_at: new Date().toISOString(),
        },
        {
          id: "msg-1",
          type: "dateza.message_received",
          title: "New message",
          body: "You have a new message on DateZA.",
          payload: { actor: { profile_id: "p3" }, target: { type: "conversation", id: "c1" } },
          read_at: null,
          created_at: new Date().toISOString(),
        },
      ],
      false,
      (url) => profileExtra("p1", "Maya")(url) ?? profileExtra("p2", "Sipho")(url) ?? profileExtra("p3", "Aisha")(url),
    );
    renderNotifications();

    expect(await screen.findByRole("button", { name: /maya liked your profile/i })).toBeInTheDocument();
    expect(screen.getByText("Welcome to DateZA")).toBeInTheDocument();
    expect(screen.getByText("It's a match!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aisha sent you a message/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /likes/i }));
    expect(screen.getByRole("button", { name: /maya liked your profile/i })).toBeInTheDocument();
    expect(screen.queryByText("Welcome to DateZA")).not.toBeInTheDocument();
    expect(screen.queryByText("It's a match!")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /activity/i }));
    expect(screen.getByText("Welcome to DateZA")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /maya liked your profile/i })).not.toBeInTheDocument();
  });

  it("saves email and push preferences from the notifications rail", async () => {
    const user = userEvent.setup();
    installHandler([]);
    renderNotifications();

    const email = await screen.findByRole("switch", { name: "Email notifications" });
    expect(email).toHaveAttribute("aria-checked", "true");
    const push = screen.getByRole("switch", { name: "Push notifications" });
    expect(push).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: "In-app notifications, always on" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enable notifications" })).toBeInTheDocument();

    await user.click(push);
    await waitFor(() => expect(push).toHaveAttribute("aria-checked", "true"));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Enable notifications" })).not.toBeInTheDocument());
    await user.click(email);
    await waitFor(() => expect(email).toHaveAttribute("aria-checked", "false"));
  });
});
