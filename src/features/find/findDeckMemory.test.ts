import { describe, expect, it } from "vitest";
import { orderFindProfiles } from "./findDeckMemory.ts";
import type { FindProfile } from "../../lib/api/findTypes.ts";

function profile(id: string): FindProfile {
  return {
    id,
    display_name: id,
    age: 26,
    bio: null,
    gender: null,
    pronouns: null,
    country_code: "ZA",
    city: null,
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
  };
}

describe("orderFindProfiles", () => {
  it("moves the remembered profile to the front when it is still in the page", () => {
    const ordered = orderFindProfiles([profile("a"), profile("b"), profile("c")], "c");
    expect(ordered.map((item) => item.id)).toEqual(["c", "a", "b"]);
  });
});
