import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FindProfile } from "../../lib/api/findTypes.ts";
import { ProfileCard } from "./ProfileCard.tsx";

/**
 * FE-03: Find's card previously labeled the generic contact-verification
 * signal "RealMe", which the field does not represent (see findTypes.ts —
 * RealMe identity/selfie verification does not exist yet).
 */
function profile(overrides: Partial<FindProfile> = {}): FindProfile {
  return {
    id: "p1",
    display_name: "Maya",
    age: 27,
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
    verified: true,
    online: false,
    active_today: false,
    new_here: false,
    last_active_at: null,
    distance_km: null,
    compatibility: null,
    ...overrides,
  };
}

const noop = () => undefined;

describe("Find ProfileCard trust label (FE-03)", () => {
  it("labels a verified profile 'Verified contact', never 'RealMe'", () => {
    render(
      <ProfileCard profile={profile({ verified: true })} interaction="idle" pending={false} onOpen={noop} onLike={vi.fn()} onPass={vi.fn()} />,
    );
    expect(screen.getByText("Verified contact")).toBeInTheDocument();
    expect(screen.queryByText(/realme/i)).not.toBeInTheDocument();
  });

  it("shows no verification badge for an unverified profile", () => {
    render(
      <ProfileCard profile={profile({ verified: false })} interaction="idle" pending={false} onOpen={noop} onLike={vi.fn()} onPass={vi.fn()} />,
    );
    expect(screen.queryByText("Verified contact")).not.toBeInTheDocument();
    expect(screen.queryByText(/realme/i)).not.toBeInTheDocument();
  });
});
