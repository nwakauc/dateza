import { useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OpsEmpty } from "../components/OpsPrimitives.tsx";

export default function OpsActivityPage() {
  const navigate = useNavigate();
  const inputId = useId();
  const [lookup, setLookup] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = lookup.trim();
    if (!trimmed) return;
    void navigate(`/ops/users/${encodeURIComponent(trimmed)}?focus=activity`);
  }

  return (
    <div className="ops-grid-2">
      <section className="ops-card">
        <OpsEmpty
          title="Global activity feed not available"
          body="There is no brand-wide security or auth activity stream endpoint. Activity history is available per member through Member 360."
        />
      </section>
      <section className="ops-card">
        <h2 style={{ marginTop: 0 }}>Inspect a member&apos;s activity</h2>
        <p className="ops-muted">Open a member to load security events and auth attempts on demand.</p>
        <form onSubmit={onSubmit}>
          <label className="ops-field" htmlFor={inputId}>
            Member lookup
            <input
              id={inputId}
              value={lookup}
              onChange={(event) => setLookup(event.target.value)}
              placeholder="email, phone, or public id"
            />
          </label>
          <button type="submit" className="ops-btn ops-btn--primary">
            Open member activity
          </button>
        </form>
        <p className="ops-muted" style={{ marginTop: 12 }}>
          <Link className="ops-inline-link" to="/ops/users">
            Go to Users search
          </Link>
        </p>
      </section>
    </div>
  );
}
