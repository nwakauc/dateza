import type { ContentReportTarget, ProfileReportReason } from "../../lib/api/safetyTypes.ts";

export const REPORT_REASON_LABELS: Record<ProfileReportReason, string> = {
  inappropriate_content: "Inappropriate content",
  harassment: "Harassment",
  spam: "Spam",
  fake_profile: "Fake profile",
  underage: "Someone under 18",
  other: "Something else",
  violence_or_threat: "Violence or threats",
  non_consensual_content: "Non-consensual content",
  impersonation: "Impersonation",
};

const CONTENT_REPORT_REASONS: Record<ContentReportTarget, readonly ProfileReportReason[]> = {
  message: [
    "inappropriate_content",
    "harassment",
    "spam",
    "underage",
    "violence_or_threat",
    "non_consensual_content",
    "other",
  ],
  conversation: ["harassment", "spam", "underage", "violence_or_threat", "inappropriate_content", "other"],
  profile_media: ["inappropriate_content", "non_consensual_content", "underage", "harassment", "other"],
  hook: ["harassment", "spam", "inappropriate_content", "underage", "other"],
};

export function contentReportReasons(targetType: ContentReportTarget): readonly ProfileReportReason[] {
  return CONTENT_REPORT_REASONS[targetType];
}

export function contentReportCopy(
  targetType: ContentReportTarget,
  name: string,
): { ariaLabel: string; heading: string; body: string; unavailable: string } {
  switch (targetType) {
    case "message":
      return {
        ariaLabel: `Report a message from ${name}`,
        heading: "Why are you reporting this?",
        body: `This report is about a message from ${name}. Choose a reason, write what happened, or both.`,
        unavailable: "That message isn’t available to report.",
      };
    case "conversation":
      return {
        ariaLabel: `Report this conversation with ${name}`,
        heading: "Why are you reporting this conversation?",
        body: `This is about the chat with ${name}, not one message. Choose a reason, write what happened, or both.`,
        unavailable: "That conversation isn’t available to report.",
      };
    case "profile_media":
      return {
        ariaLabel: `Report a photo from ${name}`,
        heading: "Why are you reporting this photo?",
        body: `This report is about a photo from ${name}. Choose a reason, write what happened, or both.`,
        unavailable: "That photo isn’t available to report.",
      };
    case "hook":
      return {
        ariaLabel: `Report this opener from ${name}`,
        heading: "Why are you reporting this opener?",
        body: `This report is about the opener ${name} sent you. Choose a reason, write what happened, or both.`,
        unavailable: "That opener isn’t available to report.",
      };
  }
}
