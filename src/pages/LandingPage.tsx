import { useEffect } from "react";
import { landingMarkup } from "./landingMarkup.ts";

// Landing page markup ported from the DateZA Landing design (Claude Design).
// Rendered as static HTML: the design is presentation-only until photo
// slots are wired up to real DateZA media.
export default function LandingPage() {
  useEffect(() => {
    const btn = document.getElementById("dz-menu-btn");
    const panel = document.getElementById("dz-nav-links");
    const backdrop = document.getElementById("dz-nav-backdrop");
    if (!btn || !panel || !backdrop) return;

    const close = () => {
      panel.classList.remove("dz-nav-open");
      backdrop.classList.remove("dz-nav-open");
      btn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };

    const open = () => {
      panel.classList.add("dz-nav-open");
      backdrop.classList.add("dz-nav-open");
      btn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    };

    const toggle = () =>
      panel.classList.contains("dz-nav-open") ? close() : open();

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    btn.addEventListener("click", toggle);
    backdrop.addEventListener("click", close);
    panel.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("a")) close();
    });
    document.addEventListener("keydown", onKeydown);

    return () => {
      btn.removeEventListener("click", toggle);
      backdrop.removeEventListener("click", close);
      document.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = "";
    };
  }, []);

  return <main dangerouslySetInnerHTML={{ __html: landingMarkup }} />;
}
