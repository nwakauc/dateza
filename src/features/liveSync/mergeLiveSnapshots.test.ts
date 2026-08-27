import { describe, expect, it } from "vitest";
import type { Conversation, Message } from "../../lib/api/socialTypes.ts";
import { mergeConversationSnapshot, mergeNewestMessagePage } from "./mergeLiveSnapshots.ts";

function message(id: string, createdAt: string): Message {
  return { id, conversation_id: "c1", sender_id: "p1", body: id, created_at: createdAt, attachments: [], reply_to: null };
}

function conversation(id: string, body: string): Conversation {
  return {
    id,
    match_id: `m-${id}`,
    status: "active",
    relationship_state: "active",
    created_at: "2026-08-26T08:00:00Z",
    profile: {
      id: `p-${id}`,
      display_name: id,
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
      photos: [],
      options: {},
    },
    last_message: { id: `lm-${id}`, sender_id: "p1", body, created_at: "2026-08-26T09:00:00Z", attachments: [] },
  };
}

describe("mergeNewestMessagePage", () => {
  it("prepends unseen newest-page messages and keeps older history", () => {
    const current = [message("msg-2", "2026-08-26T09:02:00Z"), message("msg-1", "2026-08-26T09:00:00Z"), message("msg-old", "2026-08-26T08:00:00Z")];
    const newestPage = [message("msg-3", "2026-08-26T09:04:00Z"), message("msg-2", "2026-08-26T09:02:00Z"), message("msg-1", "2026-08-26T09:00:00Z")];
    const result = mergeNewestMessagePage(current, newestPage);
    expect(result.newIds).toEqual(["msg-3"]);
    expect(result.messages.map((item) => item.id)).toEqual(["msg-3", "msg-2", "msg-1", "msg-old"]);
  });

  it("does not duplicate a message that was already sent locally", () => {
    const current = [message("msg-3", "2026-08-26T09:04:00Z"), message("msg-2", "2026-08-26T09:02:00Z")];
    const newestPage = [message("msg-3", "2026-08-26T09:04:00Z"), message("msg-2", "2026-08-26T09:02:00Z")];
    const result = mergeNewestMessagePage(current, newestPage);
    expect(result.newIds).toEqual([]);
    expect(result.messages.map((item) => item.id)).toEqual(["msg-3", "msg-2"]);
  });
});

describe("mergeConversationSnapshot", () => {
  it("updates last-message preview and brings a new conversation to the top", () => {
    const current = [conversation("c1", "Old preview"), conversation("c2", "Still here")];
    const newestPage = [conversation("c3", "Just matched"), { ...conversation("c1", "New preview") }];
    const merged = mergeConversationSnapshot(current, newestPage);
    expect(merged.map((item) => item.id)).toEqual(["c3", "c1", "c2"]);
    expect(merged[1]?.last_message?.body).toBe("New preview");
  });
});
