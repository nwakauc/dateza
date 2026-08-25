export type IconProps = {
  className?: string;
  /** Only HeartIcon uses this; declared here so every icon shares one prop
   * type and NavItem.icon can render any of them interchangeably. */
  filled?: boolean;
};

/** Compass — Discover is DateZA's curated, direction-given daily picks. */
export function CompassIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.3 8.7l-2 4.6-4.6 2 2-4.6z" />
    </svg>
  );
}

/** Magnifying glass — Find is member-driven searching/browsing. */
export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.7-4.7" />
    </svg>
  );
}

/** Same silhouette as the DateZA brand mark, so Likes reads as "hearts you
 * received/sent" rather than a generic outline icon. */
export function HeartIcon({ className, filled = true }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 30"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 26S4 19.3 4 11.9C4 7.5 7.4 4.6 11 4.6c1.7 0 3.2.7 4 1.8.8-1.1 2.3-1.8 4-1.8 3.6 0 7 2.9 7 7.3C26 19.3 15 26 15 26z" />
    </svg>
  );
}

/** Chat bubble with a tail — Chats. */
export function ChatIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8.5L6 20v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

/** Generic silhouette — Profile tab fallback when no photo is set yet. */
export function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.5 19.8c1.3-4 4.2-6 7.5-6s6.2 2 7.5 6" />
    </svg>
  );
}

/** Confirmed contact indicator; never implies RealMe identity verification. */
export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.2l6.5 2.6v4.7c0 4.6-2.8 7.9-6.5 9.3-3.7-1.4-6.5-4.7-6.5-9.3V5.8z" />
      <path d="M9 12.2l2 2 4-4.4" />
    </svg>
  );
}

/** Generic safety/report shield, no checkmark. */
export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.2l6.5 2.6v4.7c0 4.6-2.8 7.9-6.5 9.3-3.7-1.4-6.5-4.7-6.5-9.3V5.8z" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5.5 17.5h13l-1.7-2.2V10a4.8 4.8 0 0 0-9.6 0v5.3z" />
      <path d="M10 20h4" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.4l1.6 1.6M17.5 16l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.6l1.6-1.6M17.5 8l1.6-1.6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function CameraIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="12.3" r="3.4" />
    </svg>
  );
}

/** Simple X mark — used for dismiss and "pass" actions. */
export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/** Circled "i" — opens the full profile from a summary card. */
export function InfoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.2" />
      <circle cx="12" cy="8.3" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16.5 3.5l4 4L8 20H4v-4z" />
    </svg>
  );
}
