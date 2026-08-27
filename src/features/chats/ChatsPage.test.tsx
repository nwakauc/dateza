import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";

const ownerId = "owner-profile";
const completeOnboarding = {
  state: "complete",
  next_step: null,
  profile_exists: true,
  profile_complete: true,
  profile_published: true,
  completion: { complete: true, percent: 100, missing: [] },
};

function publicProfile(id = "p1", name = "Naledi") {
  return {
    id,
    display_name: name,
    age: 29,
    bio: "Slow mornings, live music and a good trail.",
    gender: "woman",
    pronouns: null,
    country_code: "ZA",
    city: "Cape Town",
    occupation: "Architect",
    job_title: "Architect",
    school_or_institution: null,
    looking_for_text: "A long-term relationship built with care.",
    height_cm: null,
    body_type: null,
    languages_spoken: ["English"],
    smoking: null,
    drinking: null,
    fitness: "active",
    photos: [{ id: `${id}-photo`, position: 0, url: "https://example.test/profile.jpg", url_expires_in: 3600 }],
    options: { relationship_intent: ["long_term_relationship"] },
  };
}

function detailProfile() {
  return {
    ...publicProfile(),
    verified: true,
    verification: { contact: { verified: true } },
    online: true,
    active_today: true,
    new_here: false,
    last_active_at: "2026-08-26T08:00:00Z",
    distance_km: 7,
    hook_tonight_active: false,
    hook_state: "hooked",
    prompts: [],
    interests: [{ slug: "hiking", label: "Hiking", category: "outdoors" }],
    compatibility: {
      score: 84,
      confidence: 0.8,
      confidence_level: "high",
      version: "dateza_v1",
      reasons: ["shared_long_term_intent"],
    },
  };
}

function conversation(id = "c1", profile = publicProfile()) {
  return {
    id,
    match_id: "m1",
    status: "active",
    created_at: "2026-08-26T08:00:00Z",
    profile,
    last_message: {
      id: "preview-1",
      sender_id: profile.id,
      body: "The trail sounds perfect.",
      created_at: "2026-08-26T09:00:00Z",
    },
  };
}

function message(id: string, senderId: string, body: string, createdAt = "2026-08-26T09:00:00Z") {
  return { id, conversation_id: "c1", sender_id: senderId, body, created_at: createdAt };
}

function receivedOpener() {
  return {
    id: "o1",
    message: "Coffee or tea — what's your usual?",
    created_at: "2026-08-26T00:00:00Z",
    expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    sender: publicProfile("s1", "Lerato"),
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
}

function renderChats(path = "/chats") {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

function installHandler(
  extra?: (url: string, method: string, init?: RequestInit) => Response | undefined,
) {
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
        profile: { id: ownerId, display_name: "Thando", options: {}, status: "active", visibility: "visible" },
        onboarding: completeOnboarding,
      }));
    }
    if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
    if (url.endsWith("/api/v1/notifications")) return Promise.resolve(jsonResponse(200, { notifications: [], unread_count: 0 }));
    if (url.endsWith("/api/v1/openers")) return Promise.resolve(jsonResponse(200, { openers: [], next_cursor: null }));
    if (url.endsWith("/api/v1/matches")) {
      return Promise.resolve(jsonResponse(200, {
        matches: [{ id: "m1", matched_at: "2026-08-25T10:00:00Z", profile: publicProfile() }],
        next_cursor: null,
      }));
    }
    if (url.endsWith("/api/v1/conversations")) {
      return Promise.resolve(jsonResponse(200, { conversations: [conversation()], next_cursor: null }));
    }
    if (url.endsWith("/api/v1/conversations/c1/messages")) {
      return Promise.resolve(jsonResponse(200, {
        messages: [message("msg-2", ownerId, "I’d love that.", "2026-08-26T09:02:00Z"), message("msg-1", "p1", "The trail sounds perfect.")],
        next_cursor: null,
      }));
    }
    if (url.endsWith("/api/v1/profiles/p1")) return Promise.resolve(jsonResponse(200, { profile: detailProfile() }));
    return Promise.resolve(jsonResponse(404, { error: "not_found" }));
  });
}

describe("premium Chats experience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    setBearerToken("opaque-token");
  });

  it("selects a conversation, renders real context, and sends confirmed text", async () => {
    const user = userEvent.setup();
    let sentBody = "";
    installHandler((url, method, init) => {
      if (url.endsWith("/api/v1/conversations/c1/messages") && method === "POST") {
        sentBody = String(init?.body);
        return jsonResponse(201, { message: message("msg-3", ownerId, "Saturday works.") });
      }
    });
    renderChats();

    await user.click(await screen.findByRole("button", { name: /naledi/i }));
    expect((await screen.findAllByLabelText(/chat with naledi/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText("84%")).toBeInTheDocument();
    expect(screen.getByText("Hiking")).toBeInTheDocument();
    expect(screen.getByText(/you matched on .*25/i)).toBeInTheDocument();
    expect(screen.getAllByText("Online now").length).toBeGreaterThan(0);

    await user.type(screen.getByRole("textbox", { name: /message naledi/i }), "Saturday works.{Enter}");
    expect((await screen.findAllByText("Saturday works.")).length).toBeGreaterThan(0);
    expect(sentBody).toBe(JSON.stringify({ body: "Saturday works." }));
  });

  it("opens photo and video attach from one control without enabling send on an empty composer", async () => {
    const user = userEvent.setup();
    installHandler();
    renderChats("/chats?conversation=c1");
    expect(await screen.findByRole("button", { name: /attach photo or video/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /attach photo or video/i }));
    expect(screen.getByRole("menuitem", { name: /^photo$/i })).toBeEnabled();
    expect(screen.getByRole("menuitem", { name: /^video$/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  });

  it("reports a received message through POST /reports", async () => {
    const user = userEvent.setup();
    let reportBody = "";
    installHandler((url, method, init) => {
      if (url.endsWith("/api/v1/reports") && method === "POST") {
        reportBody = String(init?.body);
        return jsonResponse(201, { report: { status: "received" }, created: true, blocked: false });
      }
    });
    renderChats("/chats?conversation=c1");
    expect(await screen.findByText("The trail sounds perfect.")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /message actions/i })[0]!);
    await user.click(screen.getByRole("menuitem", { name: /^report$/i }));
    await user.click(screen.getByRole("button", { name: /^harassment$/i }));
    await user.click(screen.getByRole("button", { name: /send report/i }));
    expect(await screen.findByRole("heading", { name: /report received/i })).toBeInTheDocument();
    expect(reportBody).toContain("\"target_type\":\"message\"");
    expect(reportBody).toContain("\"target_id\":\"msg-1\"");
  });

  it("keeps the draft and offers a clear recovery after send failure", async () => {
    const user = userEvent.setup();
    installHandler((url, method) => {
      if (url.endsWith("/api/v1/conversations/c1/messages") && method === "POST") {
        return jsonResponse(500, { error: "server_error" });
      }
    });
    renderChats("/chats?conversation=c1");

    const composer = await screen.findByRole("textbox", { name: /message naledi/i });
    await user.type(composer, "Please keep this draft");
    await user.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/draft is still here/i);
    expect(composer).toHaveValue("Please keep this draft");
  });

  it("uses opaque cursors for more conversations and older history", async () => {
    const user = userEvent.setup();
    const urls: string[] = [];
    installHandler((url) => {
      urls.push(url);
      if (url.endsWith("/api/v1/conversations")) {
        return jsonResponse(200, { conversations: [conversation()], next_cursor: "next page" });
      }
      if (url.includes("/api/v1/conversations?cursor=")) {
        return jsonResponse(200, {
          conversations: [conversation("c2", publicProfile("p2", "Aisha"))],
          next_cursor: null,
        });
      }
      if (url.endsWith("/api/v1/conversations/c1/messages")) {
        return jsonResponse(200, { messages: [message("msg-2", ownerId, "Latest")], next_cursor: "older page" });
      }
      if (url.includes("/api/v1/conversations/c1/messages?cursor=")) {
        return jsonResponse(200, { messages: [message("msg-old", "p1", "Earlier")], next_cursor: null });
      }
    });
    renderChats("/chats?conversation=c1");

    await user.click(await screen.findByRole("button", { name: /load more conversations/i }));
    expect(await screen.findByRole("button", { name: /aisha/i })).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /load earlier messages/i }));
    expect(await screen.findByText("Earlier")).toBeInTheDocument();
    expect(urls.some((url) => url.includes("cursor=next%20page"))).toBe(true);
    expect(urls.some((url) => url.includes("cursor=older%20page"))).toBe(true);
  });

  it("keeps the thread usable when secondary profile context fails", async () => {
    installHandler((url) => {
      if (url.endsWith("/api/v1/profiles/p1")) return jsonResponse(500, { error: "server_error" });
    });
    renderChats("/chats?conversation=c1");

    expect(await screen.findByText("I’d love that.")).toBeInTheDocument();
    expect(await screen.findByText(/profile details didn’t load/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /message naledi/i })).toBeEnabled();
  });

  it("offers useful next steps when there are no conversations", async () => {
    installHandler((url) => {
      if (url.endsWith("/api/v1/conversations")) return jsonResponse(200, { conversations: [], next_cursor: null });
      if (url.endsWith("/api/v1/matches")) return jsonResponse(200, { matches: [], next_cursor: null });
    });
    renderChats();

    await waitFor(() => expect(screen.getAllByText(/no conversations yet/i).length).toBeGreaterThan(0));
    expect(screen.getAllByRole("link", { name: /discover people/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /go to likes/i }).length).toBeGreaterThan(0);
  });

  it("does not pretend the opener inbox is empty when GET /openers fails", async () => {
    installHandler((url) => {
      if (url.endsWith("/api/v1/openers")) return jsonResponse(500, { error: "server_error" });
      if (url.endsWith("/api/v1/conversations")) return jsonResponse(200, { conversations: [], next_cursor: null });
    });
    renderChats();

    expect(await screen.findByText(/openers didn’t load/i)).toBeInTheDocument();
    expect(screen.queryByText(/when a match becomes a conversation/i)).not.toBeInTheDocument();
  });

  it("replies to an opener using the backend conversation id", async () => {
    const user = userEvent.setup();
    const replyConversation = conversation("c-reply", publicProfile("s1", "Lerato"));
    installHandler((url, method) => {
      if (url.endsWith("/api/v1/openers")) return jsonResponse(200, { openers: [receivedOpener()], next_cursor: null });
      if (url.endsWith("/api/v1/conversations")) return jsonResponse(200, { conversations: [], next_cursor: null });
      if (url.endsWith("/api/v1/openers/o1/reply") && method === "POST") {
        return jsonResponse(201, {
          conversation: { ...replyConversation, last_message: null },
          message: { id: "msg-reply", conversation_id: "c-reply", sender_id: ownerId, body: "Tea, always.", created_at: "2026-08-26T00:01:00Z" },
        });
      }
      if (url.endsWith("/api/v1/conversations/c-reply/messages")) {
        return jsonResponse(200, {
          messages: [{ id: "msg-reply", conversation_id: "c-reply", sender_id: ownerId, body: "Tea, always.", created_at: "2026-08-26T00:01:00Z" }],
          next_cursor: null,
        });
      }
      if (url.endsWith("/api/v1/profiles/s1")) return jsonResponse(200, { profile: { ...detailProfile(), id: "s1", display_name: "Lerato" } });
    });
    renderChats();

    expect(await screen.findByRole("heading", { name: /^lerato$/i })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/your reply/i), "Tea, always.");
    await user.click(screen.getByRole("button", { name: /^reply$/i }));
    expect((await screen.findAllByText("Tea, always.")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: /^new openers$/i })).not.toBeInTheDocument();
  });

  it("pages conversations until a selected id from the URL is found", async () => {
    installHandler((url) => {
      if (url.endsWith("/api/v1/conversations")) {
        return jsonResponse(200, { conversations: [conversation()], next_cursor: "page-2" });
      }
      if (url.includes("/api/v1/conversations?cursor=")) {
        return jsonResponse(200, {
          conversations: [conversation("c2", publicProfile("p2", "Aisha"))],
          next_cursor: null,
        });
      }
      if (url.endsWith("/api/v1/conversations/c2/messages")) {
        return jsonResponse(200, { messages: [message("msg-a", "p2", "Hello from page two")], next_cursor: null });
      }
      if (url.endsWith("/api/v1/profiles/p2")) {
        return jsonResponse(200, { profile: { ...detailProfile(), id: "p2", display_name: "Aisha" } });
      }
    });
    renderChats("/chats?conversation=c2");

    expect(await screen.findByText("Hello from page two")).toBeInTheDocument();
  });

  it("removes a conversation after a successful block without keeping a blocked-user cache", async () => {
    const user = userEvent.setup();
    installHandler((url, method) => {
      if (url.endsWith("/api/v1/profiles/p1/block") && method === "POST") {
        return jsonResponse(201, { blocked: true, created: true });
      }
    });
    renderChats("/chats?conversation=c1");

    expect(await screen.findByText("I’d love that.")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /more actions/i })[0]!);
    await user.click(screen.getByRole("menuitem", { name: /^block$/i }));
    await user.click(screen.getByRole("button", { name: /block naledi/i }));
    await waitFor(() => expect(screen.queryByText("I’d love that.")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Chats" })).toBeInTheDocument();
  });

  it("unmatches from chat without blocking and keeps the conversation as closed history", async () => {
    const user = userEvent.setup();
    let unmatched = false;
    installHandler((url, method) => {
      if (url.endsWith("/api/v1/matches/m1/unmatch") && method === "POST") {
        unmatched = true;
        return new Response(null, { status: 204 });
      }
    });
    renderChats("/chats?conversation=c1");

    expect(await screen.findByText("I’d love that.")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /more actions/i })[0]!);
    await user.click(screen.getByRole("menuitem", { name: /^unmatch$/i }));
    expect(screen.getByText(/does not block them/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /end match/i }));
    await waitFor(() => expect(unmatched).toBe(true));
    expect(await screen.findByText("Conversation closed")).toBeInTheDocument();
    expect(screen.queryByText(/you will no longer be able to see each other/i)).not.toBeInTheDocument();
  });
});
