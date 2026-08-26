export const PROFILE_REPORT_REASONS = [
  "inappropriate_content",
  "harassment",
  "spam",
  "fake_profile",
  "underage",
  "other",
  "violence_or_threat",
  "non_consensual_content",
  "impersonation",
] as const;

export type ProfileReportReason = (typeof PROFILE_REPORT_REASONS)[number];

export type BlockResponse = {
  blocked: true;
  created: boolean;
};

export type ReportResponse = {
  reported: true;
  created: boolean;
};

export type BlockedProfile = {
  profile: {
    id: string;
    display_name: string;
  };
  blocked_at: string;
};
