import { NavLink } from "react-router-dom";

/** Discovery and Find are separate product experiences with separate daily
 * allowances — this control switches between them, it never merges them. */
export function FeedTabs() {
  return (
    <nav className="feed-tabs" aria-label="Browse DateZA">
      <NavLink
        to="/discovery"
        className={({ isActive }) => `feed-tabs__link${isActive ? " feed-tabs__link--active" : ""}`}
      >
        Discovery
      </NavLink>
      <NavLink
        to="/find"
        className={({ isActive }) => `feed-tabs__link${isActive ? " feed-tabs__link--active" : ""}`}
      >
        Find
      </NavLink>
    </nav>
  );
}
