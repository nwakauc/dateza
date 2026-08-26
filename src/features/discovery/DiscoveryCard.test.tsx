import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DiscoveryProfile } from "../../lib/api/discoveryTypes.ts";
import { DiscoveryCard } from "./DiscoveryCard.tsx";

/** FE-03: Discovery already used the correct label — pin it against regression. */
function profile(overrides: Partial<DiscoveryProfile> = {}): DiscoveryProfile {
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

describe("DiscoveryCard trust label (FE-03)", () => {
  it("labels a verified profile 'Verified contact', never 'RealMe'", () => {
    render(
      <DiscoveryCard profile={profile({ verified: true })} interaction="idle" pending={false} onOpen={noop} onLike={vi.fn()} />,
    );
    expect(screen.getByText("Verified contact")).toBeInTheDocument();
    expect(screen.queryByText(/realme/i)).not.toBeInTheDocument();
  });

  it("shows no verification badge for an unverified profile", () => {
    render(
      <DiscoveryCard profile={profile({ verified: false })} interaction="idle" pending={false} onOpen={noop} onLike={vi.fn()} />,
    );
    expect(screen.queryByText("Verified contact")).not.toBeInTheDocument();
    expect(screen.queryByText(/realme/i)).not.toBeInTheDocument();
  });
});
