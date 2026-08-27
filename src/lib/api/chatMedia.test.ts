import { describe, expect, it, vi } from "vitest";
import {
  createChatAttachmentUploadIntent,
  deleteMessageAttachment,
  parseMessageAttachment,
  parseMessageAttachments,
} from "./chatMedia.ts";
import { parseConversation, parseMessage, sendMessage } from "./social.ts";

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

describe("chat media contract", () => {
  it("keeps text-only messages valid when attachments are omitted", () => {
    const parsed = parseMessage({
      id: "msg-1",
      conversation_id: "c1",
      sender_id: "p1",
      body: "Hi",
      created_at: "2026-08-26T09:00:00Z",
    });
    expect(parsed.body).toBe("Hi");
    expect(parsed.attachments).toEqual([]);
  });

  it("accepts a media-only message with a null body and D8N flat delivery URLs", () => {
    const parsed = parseMessage({
      id: "msg-2",
      conversation_id: "c1",
      sender_id: "p1",
      body: null,
      created_at: "2026-08-26T09:00:00Z",
      attachments: [
        {
          id: "att-1",
          media_kind: "image",
          processing_state: "ready",
          deleted: false,
          content_type: "image/jpeg",
          byte_size: 80_000,
          width: 1600,
          height: 1200,
          duration_seconds: null,
          view_url: "https://cdn.example/view",
          download_url: "https://cdn.example/download",
        },
      ],
    });
    expect(parsed.body).toBe("");
    expect(parsed.attachments[0]?.media_kind).toBe("image");
    expect(parsed.attachments[0]?.display?.url).toContain("view");
    expect(parsed.attachments[0]?.download?.url).toContain("download");
    expect(parsed.attachments[0]?.display?.url).not.toBe(parsed.attachments[0]?.download?.url);
  });

  it("does not treat pending or failed attachments as playable", () => {
    const pending = parseMessageAttachment({
      id: "att-p",
      media_kind: "video",
      processing_state: "processing",
      deleted: false,
      content_type: "video/mp4",
      byte_size: 1_000,
      width: null,
      height: null,
      duration_seconds: null,
    });
    const failed = parseMessageAttachment({
      id: "att-f",
      media_kind: "image",
      processing_state: "failed",
      deleted: false,
      content_type: "image/jpeg",
      byte_size: 1_000,
      width: null,
      height: null,
      duration_seconds: null,
    });
    expect(pending?.display).toBeNull();
    expect(failed?.display).toBeNull();
    expect(parseMessageAttachments([{ id: "att-x", media_kind: "voice", processing_state: "ready" }])).toEqual([]);
    expect(parseMessageAttachment({ id: "nope" })).toBeUndefined();
  });

  it("sends media with attachment_uploads and omits a blank body", async () => {
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, {
        message: {
          id: "msg-3",
          conversation_id: "c1",
          sender_id: "owner",
          body: null,
          created_at: "2026-08-26T09:01:00Z",
          attachments: [{ id: "att-1", media_kind: "video", processing_state: "pending", deleted: false }],
        },
      }),
    );
    const sent = await sendMessage("c1", {
      attachment_uploads: [{ signed_id: "signed-blob", media_kind: "video" }],
    });
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ attachment_uploads: [{ signed_id: "signed-blob", media_kind: "video" }] }),
    );
    expect(sent.body).toBe("");
    expect(sent.attachments[0]?.media_kind).toBe("video");
  });

  it("deletes one attachment at the D8N attachment path", async () => {
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { attachment: { id: "att-1", deleted: true } }));
    await deleteMessageAttachment("c1", "msg-1", "att-1");
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toBe(
      "/api/v1/conversations/c1/messages/msg-1/attachments/att-1",
    );
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.method).toBe("DELETE");
  });

  it("requests a conversation-scoped upload intent without a product size in the body", async () => {
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, {
        upload: {
          signed_id: "sid",
          url: "https://r2.example/put",
          headers: { "Content-Type": "video/mp4" },
          expires_in: 300,
          byte_size_limit: 786_432_000,
          allowed_content_types: ["video/mp4", "video/quicktime"],
        },
      }),
    );
    const intent = await createChatAttachmentUploadIntent("c1", {
      content_type: "video/mp4",
      byte_size: 42_000_000,
      checksum: "abc",
      filename: "clip.mp4",
      media_kind: "video",
    });
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toBe("/api/v1/conversations/c1/attachments/uploads");
    expect(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body)).not.toContain("25");
    expect(intent.byte_size_limit).toBe(786_432_000);
  });

  it("previews a media-only last_message without requiring body text", () => {
    const parsed = parseConversation({
      id: "c1",
      match_id: "m1",
      status: "active",
      created_at: "2026-08-26T08:00:00Z",
      profile: publicProfile,
      last_message: {
        id: "msg-1",
        sender_id: "p1",
        body: null,
        created_at: "2026-08-26T09:00:00Z",
      },
    });
    expect(parsed.last_message?.body).toBe("");
    expect(parsed.last_message?.attachments).toEqual([]);
  });
});
