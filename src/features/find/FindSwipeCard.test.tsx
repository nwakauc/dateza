import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FindProfile } from "../../lib/api/findTypes.ts";
import { FindSwipeCard } from "./FindSwipeCard.tsx";
import { buildOptionLabelLookup } from "./optionLabels.ts";
import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";

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
    verified: false,
    online: false,
    active_today: false,
    new_here: false,
    last_active_at: null,
    distance_km: null,
    compatibility: null,
    ...overrides,
  };
}

function configuration(): ProfileConfiguration {
  return {
    identity_fields: [],
    profile_fields: [],
    preference_fields: [],
    collections: [],
    option_groups: [
      {
        key: "relationship_intent",
        label: "Looking for",
        cardinality: "single",
        max_selections: 1,
        required: true,
        visibility: "public_profile",
        options: [
          { code: "long_term_relationship", label: "Long-term relationship", category: null },
          { code: "friendship", label: "Friendship", category: null },
        ],
      },
      {
        key: "interests",
        label: "Interests",
        cardinality: "multiple",
        max_selections: 10,
        required: false,
        visibility: "public_profile",
        options: [
          { code: "hiking", label: "Hiking", category: null },
          { code: "live_music", label: "Live music", category: null },
          { code: "coffee", label: "Coffee", category: null },
          { code: "food", label: "Food", category: null },
        ],
      },
    ],
  };
}

const noop = () => undefined;
const lookup = buildOptionLabelLookup(configuration());
const emptyLookup = buildOptionLabelLookup(undefined);

describe("FindSwipeCard", () => {
  it("labels a verified profile 'Verified contact', never 'RealMe'", () => {
    render(<FindSwipeCard profile={profile({ verified: true })} interaction="idle" optionLabel={lookup} onOpenDetail={noop} />);
    expect(screen.getByText("Verified contact")).toBeInTheDocument();
    expect(screen.queryByText(/realme/i)).not.toBeInTheDocument();
  });

  it("shows no verification badge for an unverified profile", () => {
    render(<FindSwipeCard profile={profile({ verified: false })} interaction="idle" optionLabel={lookup} onOpenDetail={noop} />);
    expect(screen.queryByText("Verified contact")).not.toBeInTheDocument();
  });

  it("renders compatibility score and up to two reasons from backend data", () => {
    render(
      <FindSwipeCard
        profile={profile({
          compatibility: {
            score: 87,
            confidence: 0.9,
            confidence_level: "high",
            version: "dateza_v1",
            reasons: ["shared_long_term_intent", "shared_interests", "shared_languages"],
          },
        })}
        interaction="idle"
        optionLabel={lookup}
        onOpenDetail={noop}
      />,
    );
    expect(screen.getByText("87% compatible")).toBeInTheDocument();
    expect(screen.getByText(/both want something long-term/i)).toBeInTheDocument();
    // Capped at two reasons, so the third shouldn't render.
    expect(screen.queryByText(/shared languages/i)).not.toBeInTheDocument();
  });

  it("does not render a compatibility badge when the backend returns null", () => {
    render(<FindSwipeCard profile={profile({ compatibility: null })} interaction="idle" optionLabel={lookup} onOpenDetail={noop} />);
    expect(screen.queryByText(/% compatible/)).not.toBeInTheDocument();
  });

  it("shows relationship intent and interests as human labels, not raw codes", () => {
    render(
      <FindSwipeCard
        profile={profile({ options: { relationship_intent: ["long_term_relationship"], interests: ["hiking", "live_music", "coffee", "food"] } })}
        interaction="idle"
        optionLabel={lookup}
        onOpenDetail={noop}
      />,
    );
    expect(screen.getByText(/long-term relationship/i)).toBeInTheDocument();
    expect(screen.getByText(/hiking/i)).toBeInTheDocument();
    // Capped at 3 interests shown.
    expect(screen.queryByText(/food/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hiking.*live_music/)).not.toBeInTheDocument();
  });

  it("hides relationship intent/interests entirely when configuration labels are unavailable, rather than showing raw codes", () => {
    render(
      <FindSwipeCard
        profile={profile({ options: { relationship_intent: ["long_term_relationship"] } })}
        interaction="idle"
        optionLabel={emptyLookup}
        onOpenDetail={noop}
      />,
    );
    expect(screen.queryByText(/long_term_relationship/)).not.toBeInTheDocument();
    expect(screen.queryByText(/long-term relationship/i)).not.toBeInTheDocument();
  });

  it("shows a truncated bio excerpt when present", () => {
    const longBio = "A".repeat(200);
    render(<FindSwipeCard profile={profile({ bio: longBio })} interaction="idle" optionLabel={lookup} onOpenDetail={noop} />);
    const bioNode = screen.getByText(/^"A+…?"$/);
    expect(bioNode.textContent!.length).toBeLessThan(longBio.length);
  });

  it("navigates between multiple photos via accessible controls, without triggering Like/Pass", async () => {
    const user = userEvent.setup();
    const onOpenDetail = vi.fn();
    render(
      <FindSwipeCard
        profile={profile({
          photos: [
            { id: "ph1", position: 0, url: "https://example.test/1.jpg", url_expires_in: 3600 },
            { id: "ph2", position: 1, url: "https://example.test/2.jpg", url_expires_in: 3600 },
          ],
        })}
        interaction="idle"
        optionLabel={lookup}
        onOpenDetail={onOpenDetail}
      />,
    );

    expect(screen.getByText("Photo 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous photo/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /next photo/i }));
    expect(screen.getByText("Photo 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next photo/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /previous photo/i }));
    expect(screen.getByText("Photo 1 of 2")).toBeInTheDocument();

    // No Pass/Like control lives inside the card at all (FindActions owns
    // those, rendered separately by FindPage) — photo nav can't reach them.
    expect(screen.queryByRole("button", { name: /^pass$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^like$/i })).not.toBeInTheDocument();
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  it("does not render photo navigation for a single photo", () => {
    render(
      <FindSwipeCard
        profile={profile({ photos: [{ id: "ph1", position: 0, url: "https://example.test/1.jpg", url_expires_in: 3600 }] })}
        interaction="idle"
        optionLabel={lookup}
        onOpenDetail={noop}
      />,
    );
    expect(screen.queryByRole("button", { name: /next photo/i })).not.toBeInTheDocument();
  });

  it("opens the full profile via the info control", async () => {
    const user = userEvent.setup();
    const onOpenDetail = vi.fn();
    render(<FindSwipeCard profile={profile({ display_name: "Maya" })} interaction="idle" optionLabel={lookup} onOpenDetail={onOpenDetail} />);
    await user.click(screen.getByRole("button", { name: /open maya's full profile/i }));
    expect(onOpenDetail).toHaveBeenCalledTimes(1);
  });

  it("opens the full profile from the name and from the photo", async () => {
    const user = userEvent.setup();
    const onOpenDetail = vi.fn();
    render(
      <FindSwipeCard
        profile={profile({
          display_name: "Maya",
          photos: [{ id: "ph1", position: 0, url: "https://example.test/1.jpg", url_expires_in: 3600 }],
        })}
        interaction="idle"
        optionLabel={lookup}
        onOpenDetail={onOpenDetail}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Maya" }));
    expect(onOpenDetail).toHaveBeenCalledTimes(1);
    await user.click(screen.getByAltText(""));
    expect(onOpenDetail).toHaveBeenCalledTimes(2);
  });

  it("shows a match note when interaction is matched", () => {
    render(<FindSwipeCard profile={profile()} interaction="matched" optionLabel={lookup} onOpenDetail={noop} />);
    expect(screen.getByText(/it's a match!/i)).toBeInTheDocument();
  });
});
