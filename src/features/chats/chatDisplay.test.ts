import { describe, expect, it } from "vitest";
import { conversationCanCompose, conversationIsEnded, conversationPreviewLabel } from "./chatDisplay.ts";

describe("conversation preview copy", () => {
  it("uses body text when present", () => {
    expect(
      conversationPreviewLabel({
        id: "m1",
        sender_id: "p1",
        body: "The trail sounds perfect.",
        created_at: "2026-08-26T09:00:00Z",
        attachments: [],
      }),
    ).toBe("The trail sounds perfect.");
  });

  it("labels a media-only last message without inventing a snippet", () => {
    expect(
      conversationPreviewLabel({
        id: "m1",
        sender_id: "p1",
        body: "",
        created_at: "2026-08-26T09:00:00Z",
        attachments: [
          {
            id: "att-1",
            media_kind: "video",
            processing_state: "ready",
            position: 0,
            width: null,
            height: null,
            duration_seconds: null,
            deleted: false,
            content_type: "video/mp4",
            byte_size: 1_200_000,
            display: null,
            poster: null,
            download: null,
          },
        ],
      }),
    ).toBe("Video");
  });

  it("labels a media-only last_message when D8N omits attachment metadata", () => {
    expect(
      conversationPreviewLabel({
        id: "m1",
        sender_id: "p1",
        body: "",
        created_at: "2026-08-26T09:00:00Z",
        attachments: [],
      }),
    ).toBe("Photo or video");
  });
});

describe("conversation compose eligibility", () => {
  it("treats an ended match as read-only even when conversation status is still active", () => {
    const base = {
      status: "active" as const,
      relationship_state: "active" as const,
    };
    expect(conversationCanCompose(base)).toBe(true);
    expect(conversationIsEnded(base)).toBe(false);
    expect(conversationCanCompose({ ...base, relationship_state: "ended" })).toBe(false);
    expect(conversationIsEnded({ relationship_state: "ended" })).toBe(true);
    expect(conversationCanCompose({ ...base, status: "closed" })).toBe(false);
  });
});
