import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./errors.ts";
import { listConversations, listIncomingLikes, listMatches, listMessages, listOutgoingLikes, parseConversation, sendMessage, startConversation, unmatchMatch } from "./social.ts";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const publicProfile = {
  id: "p1",
  display_name: "Naledi",
  age: 29,
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
  photos: [],
  options: {},
};

const conversation = {
  id: "c1",
  match_id: "m1",
  status: "active",
  created_at: "2026-08-26T08:00:00Z",
  profile: publicProfile,
  last_message: null,
};

describe("social adapter", () => {
  it("parses conversations with a null last_message instead of inventing a preview", () => {
    const parsed = parseConversation(conversation);
    expect(parsed.last_message).toBeNull();
    expect(parsed.profile.id).toBe("p1");
  });

  it("lists matches from GET /matches with the public profile id", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, {
        matches: [{ id: "m1", matched_at: "2026-08-25T10:00:00Z", profile: publicProfile }],
        next_cursor: "more-matches",
      }),
    );
    const result = await listMatches();
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toContain("/api/v1/matches");
    expect(result.matches[0]?.id).toBe("m1");
    expect(result.matches[0]?.profile.id).toBe("p1");
    expect(result.next_cursor).toBe("more-matches");
  });

  it("starts or reuses a conversation from POST /matches/:id/conversation", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { conversation, created: false }));
    const result = await startConversation("m1");
    const call = vi.mocked(fetch).mock.calls[0];
    expect(String(call?.[0])).toContain("/api/v1/matches/m1/conversation");
    expect(call?.[1]?.method).toBe("POST");
    expect(result.id).toBe("c1");
  });

  it("lists conversations without fabricating unread fields", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, {
        conversations: [{ ...conversation, last_message: { id: "msg-1", sender_id: "p1", body: "Hi", created_at: "2026-08-26T09:00:00Z" } }],
        next_cursor: null,
      }),
    );
    const result = await listConversations();
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toContain("/api/v1/conversations");
    expect(result.conversations[0]?.last_message?.body).toBe("Hi");
    expect(result.conversations[0]).not.toHaveProperty("unread_count");
  });

  it("parses relationship_state from D8N and defaults omitted values to active", () => {
    expect(parseConversation({ ...conversation, relationship_state: "ended" }).relationship_state).toBe("ended");
    expect(parseConversation(conversation).relationship_state).toBe("active");
  });

  it("parses reply_to snapshots additively and sends reply_to_message_id", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(200, {
          messages: [{
            id: "msg-2",
            conversation_id: "c1",
            sender_id: "p2",
            body: "replying",
            created_at: "2026-08-26T09:01:00Z",
            reply_to: {
              id: "msg-1",
              sender_id: "p1",
              message_type: "text",
              body_excerpt: "Original text",
              deleted: false,
            },
          }],
          next_cursor: null,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(201, {
          message: {
            id: "msg-3",
            conversation_id: "c1",
            sender_id: "owner",
            body: "Hello",
            created_at: "2026-08-26T09:02:00Z",
            reply_to: {
              id: "msg-1",
              sender_id: "p1",
              message_type: "text",
              body_excerpt: "Original text",
              deleted: false,
            },
          },
        }),
      );
    const listed = await listMessages("c1");
    expect(listed.messages[0]?.reply_to?.id).toBe("msg-1");
    expect(listed.messages[0]?.reply_to?.body_excerpt).toBe("Original text");
    const sent = await sendMessage("c1", { body: "Hello", reply_to_message_id: "msg-1" });
    expect(vi.mocked(fetch).mock.calls[1]?.[1]?.body).toBe(JSON.stringify({ body: "Hello", reply_to_message_id: "msg-1" }));
    expect(sent.reply_to?.id).toBe("msg-1");
  });

  it("lists and sends messages with { body } only", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(200, {
          messages: [{ id: "msg-1", conversation_id: "c1", sender_id: "p1", body: "Hi", created_at: "2026-08-26T09:00:00Z" }],
          next_cursor: "older",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(201, {
          message: { id: "msg-2", conversation_id: "c1", sender_id: "owner", body: "Hello", created_at: "2026-08-26T09:01:00Z" },
        }),
      );
    const listed = await listMessages("c1");
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toContain("/api/v1/conversations/c1/messages");
    expect(listed.next_cursor).toBe("older");
    const sent = await sendMessage("c1", "Hello");
    const sendCall = vi.mocked(fetch).mock.calls[1];
    expect(sendCall?.[1]?.body).toBe(JSON.stringify({ body: "Hello" }));
    expect(String(sendCall?.[1]?.body)).not.toContain("client_token");
    expect(String(sendCall?.[1]?.body)).not.toContain("reply_to_message_id");
    expect(sent.body).toBe("Hello");
    expect(sent.reply_to).toBeNull();
  });

  it("does not treat a failed send as success", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, { error: "server_error" }));
    await expect(sendMessage("c1", "Hello")).rejects.toBeInstanceOf(ApiError);
  });

  it("lists incoming likes with cursor pagination and null compatibility", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, {
        likes: [{ liked_at: "2026-08-27T08:00:00Z", profile: { ...publicProfile, compatibility: null } }],
        next_cursor: "next-likes",
      }),
    );
    const result = await listIncomingLikes();
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toBe("/api/v1/likes/incoming");
    expect(result.likes[0]?.profile.id).toBe("p1");
    expect(result.likes[0]?.profile.compatibility).toBeNull();
    expect(result.next_cursor).toBe("next-likes");
  });

  it("lists outgoing likes and passes the server cursor", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { likes: [{ liked_at: "2026-08-27T08:00:00Z", profile: publicProfile }], next_cursor: null }));
    await listOutgoingLikes("cursor-1");
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toBe("/api/v1/likes/outgoing?cursor=cursor-1");
  });

  it("unmatches with POST /matches/:id/unmatch and accepts 204", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    await unmatchMatch("m1");
    const call = vi.mocked(fetch).mock.calls[0];
    expect(String(call?.[0])).toBe("/api/v1/matches/m1/unmatch");
    expect(call?.[1]?.method).toBe("POST");
  });
});
