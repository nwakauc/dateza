import { useState, type FormEvent } from "react";
import { geocodeSuburb, type GeocodeResult } from "../../../lib/api/geocode.ts";
import { updateProfileLocation } from "../../../lib/api/profile.ts";
import { markLocationConfirmed } from "../../../lib/locationConfirmationStore.ts";

type Props = {
  profileId: string;
  onSaved: () => void;
};

export function DatingLocationSearch({ profileId, onSaved }: Props) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"idle" | "searching" | "results" | "saving" | "not-found" | "error">("idle");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [message, setMessage] = useState<string | undefined>();

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase === "searching" || phase === "saving") return;
    setPhase("searching");
    setMessage(undefined);
    try {
      const found = await geocodeSuburb(query);
      setResults(found);
      setPhase(found.length > 0 ? "results" : "not-found");
    } catch {
      setPhase("error");
      setMessage("We couldn't search that area. Try again.");
    }
  }

  async function choose(result: GeocodeResult) {
    if (phase === "saving") return;
    setPhase("saving");
    try {
      const status = await updateProfileLocation({
        latitude: result.latitude,
        longitude: result.longitude,
        accuracy_meters: 3000,
        captured_at: new Date().toISOString(),
      });
      if (!status.configured) {
        setPhase("error");
        setMessage("We couldn't update your dating location.");
        return;
      }
      setPhase("idle");
      setResults([]);
      setQuery("");
      markLocationConfirmed(profileId);
      onSaved();
    } catch {
      setPhase("error");
      setMessage("We couldn't update your dating location. Try again.");
    }
  }

  return (
    <div className="edit-location">
      <form className="edit-location__form" onSubmit={(event) => void search(event)}>
        <label className="auth-field">
          <span>Suburb or area</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sea Point, Cape Town"
            disabled={phase === "searching" || phase === "saving"}
          />
        </label>
        <button className="shell-text-action" type="submit" disabled={query.trim().length < 2 || phase === "searching"}>
          {phase === "searching" ? "Searching…" : "Find area"}
        </button>
      </form>
      {phase === "not-found" ? <p className="auth-form__hint">We couldn’t find that area. Try a nearby suburb.</p> : null}
      {message ? (
        <p className="auth-form__error" role="alert">
          {message}
        </p>
      ) : null}
      {results.length > 0 ? (
        <ul className="edit-location__results">
          {results.map((result) => (
            <li key={`${result.latitude},${result.longitude}`}>
              <button type="button" disabled={phase === "saving"} onClick={() => void choose(result)}>
                {result.displayName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="auth-form__hint">Set this once. DateZA uses it to show people nearby — not as an online status.</p>
    </div>
  );
}
