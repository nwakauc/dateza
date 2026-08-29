import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHqBrand } from "./useHqBrand.ts";

export function BrandSelector() {
  const { status, brandName, brandSlug } = useHqBrand();

  if (status === "loading") {
    return (
      <div className="hq-control hq-control--muted" aria-busy="true">
        Loading brand…
      </div>
    );
  }

  return (
    <div
      className="hq-control"
      title="Brand is resolved from the API host. Cross-brand All Company is not available in Phase 1."
      aria-label="Brand context"
    >
      <span>{brandName ?? brandSlug ?? "Unknown brand"}</span>
      <span className="hq-nav-link__meta">Host</span>
    </div>
  );
}

export function DateRangeSelector() {
  return (
    <div
      className="hq-control hq-control--muted"
      title="Date range applies once metric backends exist"
      aria-disabled="true"
    >
      Date range · Last 7 days
      <span className="hq-nav-link__meta">Soon</span>
    </div>
  );
}

export function GlobalSearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="hq-control hq-control--button" onClick={onOpen}>
      <span>Search D8N</span>
      <kbd>⌘K</kbd>
    </button>
  );
}

export function GlobalSearchPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }
  return <GlobalSearchPaletteOpen onClose={onClose} />;
}

function GlobalSearchPaletteOpen({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const inputId = useId();
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    const params = new URLSearchParams();
    params.set("q", trimmed);
    params.set("run", "1");
    onClose();
    void navigate(`/hq/members?${params.toString()}`);
  }

  return (
    <div className="hq-palette" role="dialog" aria-modal="true" aria-labelledby={inputId}>
      <div className="hq-palette__panel">
        <input
          id={inputId}
          className="hq-palette__input"
          autoFocus
          value={query}
          placeholder="Email, phone, or profile public id"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
        <p className="hq-palette__hint">
          Exact identifier lookup on this brand only. Unknown and cross-brand identifiers both look
          like “not found” — that is intentional.
        </p>
      </div>
      <button type="button" className="visually-hidden" onClick={onClose}>
        Close search
      </button>
    </div>
  );
}

export function OperatorIdentity() {
  const { operatorLabel } = useHqBrand();
  const initial = operatorLabel.trim().slice(0, 1).toUpperCase() || "O";

  return (
    <div className="hq-operator" aria-label="Signed-in operator">
      <div className="hq-operator__avatar" aria-hidden="true">
        {initial}
      </div>
      <div className="hq-operator__meta">
        <span className="hq-operator__name">{operatorLabel}</span>
        <span className="hq-operator__role">Moderator</span>
      </div>
    </div>
  );
}

export function HqHeader({
  title,
  subtitle,
  onOpenSearch,
  onToggleSidebar,
}: {
  title: string;
  subtitle?: string;
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="hq-header">
      <div className="hq-header__titles">
        <button
          type="button"
          className="hq-control hq-control--button hq-mobile-nav-toggle"
          onClick={onToggleSidebar}
          aria-label="Open navigation"
        >
          Menu
        </button>
        <div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      <div className="hq-header__controls">
        <BrandSelector />
        <DateRangeSelector />
        <GlobalSearchTrigger onOpen={onOpenSearch} />
        <OperatorIdentity />
      </div>
    </header>
  );
}
