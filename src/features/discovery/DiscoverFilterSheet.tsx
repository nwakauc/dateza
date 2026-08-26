import type { FieldOption, ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import { Modal } from "../verification/Modal.tsx";
import { customFilterCount, EMPTY_DISCOVER_FILTERS, type DiscoverFilters } from "./discoverFilters.ts";

type Props = {
  open: boolean;
  filters: DiscoverFilters;
  configuration: ProfileConfiguration | undefined;
  onChange: (filters: DiscoverFilters) => void;
  onClose: () => void;
};

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100] as const;
const COMPAT_OPTIONS = [70, 80, 90] as const;

function groupOptions(configuration: ProfileConfiguration | undefined, key: string): FieldOption[] {
  return configuration?.option_groups.find((group) => group.key === key)?.options ?? [];
}

function fieldOptions(configuration: ProfileConfiguration | undefined, key: string): FieldOption[] {
  return configuration?.profile_fields.find((field) => field.key === key)?.options ?? [];
}

function toggleCode(list: string[], code: string): string[] {
  return list.includes(code) ? list.filter((item) => item !== code) : [...list, code];
}

function ChipRow({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: FieldOption[];
  selected: string[];
  onToggle: (code: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset className="discover-filter__fieldset">
      <legend>{legend}</legend>
      <div className="discover-filter__chips">
        {options.map((option) => {
          const on = selected.includes(option.code);
          return (
            <button
              key={option.code}
              type="button"
              className={`discover-filter__chip${on ? " discover-filter__chip--on" : ""}`}
              aria-pressed={on}
              onClick={() => onToggle(option.code)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="discover-filter__soon">
      <span>{label}</span>
      <span className="discover-filter__soon-badge">Coming soon</span>
    </div>
  );
}

export function DiscoverFilterSheet({ open, filters, configuration, onChange, onClose }: Props) {
  if (!open) return null;

  const intents = groupOptions(configuration, "relationship_intent");
  const interests = groupOptions(configuration, "interests");
  const smoking = fieldOptions(configuration, "smoking");
  const drinking = fieldOptions(configuration, "drinking");
  const fitness = fieldOptions(configuration, "fitness");
  const custom = customFilterCount(filters);

  return (
    <Modal
      ariaLabel="Discover filters"
      onClose={onClose}
      backdropClassName="verify-modal-backdrop discover-filter-backdrop"
      panelClassName="verify-modal discover-filter-panel"
    >
      <div className="discover-filter">
        <header className="discover-filter__head">
          <h2>Filters</h2>
          <p>These look through today's curated picks — they don't fetch a different set of people.</p>
        </header>

        <section className="discover-filter__group" aria-labelledby="discover-filter-basics">
          <h3 id="discover-filter-basics">Basics</h3>
          <label className="discover-filter__range">
            <span>Minimum age</span>
            <input
              type="number"
              min={18}
              max={99}
              inputMode="numeric"
              value={filters.minAge ?? ""}
              onChange={(event) => {
                const next = Number(event.target.value);
                onChange({ ...filters, minAge: event.target.value === "" || !Number.isFinite(next) ? null : next });
              }}
            />
          </label>
          <label className="discover-filter__range">
            <span>Maximum age</span>
            <input
              type="number"
              min={18}
              max={99}
              inputMode="numeric"
              value={filters.maxAge ?? ""}
              onChange={(event) => {
                const next = Number(event.target.value);
                onChange({ ...filters, maxAge: event.target.value === "" || !Number.isFinite(next) ? null : next });
              }}
            />
          </label>
          <fieldset className="discover-filter__fieldset">
            <legend>Distance</legend>
            <div className="discover-filter__chips">
              {DISTANCE_OPTIONS.map((km) => {
                const on = filters.maxDistanceKm === km;
                return (
                  <button
                    key={km}
                    type="button"
                    className={`discover-filter__chip${on ? " discover-filter__chip--on" : ""}`}
                    aria-pressed={on}
                    onClick={() => onChange({ ...filters, maxDistanceKm: on ? null : km })}
                  >
                    Within {km} km
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section className="discover-filter__group" aria-labelledby="discover-filter-connection">
          <h3 id="discover-filter-connection">Connection</h3>
          <ChipRow
            legend="Relationship intent"
            options={intents}
            selected={filters.relationshipIntents}
            onToggle={(code) => onChange({ ...filters, relationshipIntents: toggleCode(filters.relationshipIntents, code) })}
          />
          {intents.length === 0 ? <ComingSoon label="Relationship intent" /> : null}
          <fieldset className="discover-filter__fieldset">
            <legend>Compatibility</legend>
            <div className="discover-filter__chips">
              {COMPAT_OPTIONS.map((score) => {
                const on = filters.minCompatibility === score;
                return (
                  <button
                    key={score}
                    type="button"
                    className={`discover-filter__chip${on ? " discover-filter__chip--on" : ""}`}
                    aria-pressed={on}
                    onClick={() => onChange({ ...filters, minCompatibility: on ? null : score })}
                  >
                    {score}%+ match
                  </button>
                );
              })}
            </div>
          </fieldset>
          {interests.length > 0 ? (
            <ChipRow
              legend="Interests"
              options={interests.slice(0, 12)}
              selected={filters.interests}
              onToggle={(code) => onChange({ ...filters, interests: toggleCode(filters.interests, code) })}
            />
          ) : (
            <ComingSoon label="Interests" />
          )}
        </section>

        <section className="discover-filter__group" aria-labelledby="discover-filter-lifestyle">
          <h3 id="discover-filter-lifestyle">Lifestyle</h3>
          {smoking.length > 0 ? (
            <ChipRow
              legend="Smoking"
              options={smoking}
              selected={filters.smoking}
              onToggle={(code) => onChange({ ...filters, smoking: toggleCode(filters.smoking, code) })}
            />
          ) : (
            <ComingSoon label="Smoking" />
          )}
          {drinking.length > 0 ? (
            <ChipRow
              legend="Drinking"
              options={drinking}
              selected={filters.drinking}
              onToggle={(code) => onChange({ ...filters, drinking: toggleCode(filters.drinking, code) })}
            />
          ) : (
            <ComingSoon label="Drinking" />
          )}
          {fitness.length > 0 ? (
            <ChipRow
              legend="Fitness"
              options={fitness}
              selected={filters.fitness}
              onToggle={(code) => onChange({ ...filters, fitness: toggleCode(filters.fitness, code) })}
            />
          ) : (
            <ComingSoon label="Fitness" />
          )}
          <ComingSoon label="Religion" />
          <ComingSoon label="Education" />
          <ComingSoon label="Children / family plans" />
        </section>

        <section className="discover-filter__group" aria-labelledby="discover-filter-trust">
          <h3 id="discover-filter-trust">Trust</h3>
          <label className="discover-filter__toggle">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(event) => onChange({ ...filters, verifiedOnly: event.target.checked })}
            />
            Verified contact
          </label>
        </section>

        <section className="discover-filter__group" aria-labelledby="discover-filter-activity">
          <h3 id="discover-filter-activity">Activity</h3>
          <label className="discover-filter__toggle">
            <input
              type="checkbox"
              checked={filters.online}
              onChange={(event) => onChange({ ...filters, online: event.target.checked })}
            />
            Online now
          </label>
          <label className="discover-filter__toggle">
            <input
              type="checkbox"
              checked={filters.newHere}
              onChange={(event) => onChange({ ...filters, newHere: event.target.checked })}
            />
            New here
          </label>
          <ComingSoon label="Presence beyond today's picks" />
        </section>

        <div className="discover-filter__actions">
          <button
            type="button"
            className="discover-filter__clear"
            onClick={() => onChange(EMPTY_DISCOVER_FILTERS)}
            disabled={!custom && !filters.online && !filters.nearby && !filters.newHere}
          >
            Clear filters
          </button>
          <button type="button" className="shell-primary-action" onClick={onClose} data-autofocus>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
