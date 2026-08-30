import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { findHqNavItem } from "./navConfig.ts";
import { HqBrandProvider } from "./HqBrandContext.tsx";
import { HqMfaGate } from "./HqMfaGate.tsx";
import { GlobalSearchPalette, HqHeader } from "./HqHeader.tsx";
import { HqSidebar } from "./HqSidebar.tsx";
import "./hq.css";

function HqShellInner() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navItem = findHqNavItem(location.pathname);
  const isReportDetail = /\/hq\/trust-safety\/reports\//.test(location.pathname);
  const title =
    location.pathname.startsWith("/hq/members/")
      ? "Member 360"
      : isReportDetail
        ? "Report detail"
        : (navItem?.label ?? "D8N HQ");
  const subtitle =
    title === "Command Centre"
      ? "Real-time overview of everything happening across D8N."
      : title === "Members" || title === "Member 360"
        ? "Look up a member and inspect operational state for the selected brand."
        : title === "Trust & Safety"
          ? "Moderation queue, repeat offenders, and enforcement history for this brand."
          : title === "Report detail"
            ? "Inspect evidence and apply lifecycle or account enforcement actions."
            : navItem?.availability === "ready"
              ? undefined
              : "This area is reserved in the shell and not implemented yet.";

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    document.title = `${title} — D8N HQ`;
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, [title]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const isMetaK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isMetaK) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="hq-root" data-sidebar-open={sidebarOpen ? "true" : "false"}>
      <HqSidebar onNavigate={closeSidebar} />
      <div className="hq-main">
        <HqHeader
          title={title}
          subtitle={subtitle}
          onOpenSearch={() => setSearchOpen(true)}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />
        <Outlet />
      </div>
      <GlobalSearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      {sidebarOpen ? (
        <button
          type="button"
          className="hq-palette"
          aria-label="Close navigation"
          onClick={closeSidebar}
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 19 }}
        />
      ) : null}
    </div>
  );
}

export default function HqShell() {
  return (
    <HqBrandProvider>
      <HqMfaGate>
        <HqShellInner />
      </HqMfaGate>
    </HqBrandProvider>
  );
}
