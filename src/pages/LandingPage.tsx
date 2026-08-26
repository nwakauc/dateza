import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { landingMarkup } from "./landingMarkup.ts";

function scrollLandingHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ block: "start" });
}

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const frame = requestAnimationFrame(() => scrollLandingHash(location.hash));
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [location.hash]);

  useEffect(() => {
    const btn = document.getElementById("dz-menu-btn");
    const panel = document.getElementById("dz-nav-links");
    const backdrop = document.getElementById("dz-nav-backdrop");
    const page = document.querySelector(".dz-page");
    if (!btn || !panel || !backdrop || !page) return;

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

    const toggle = () => (panel.classList.contains("dz-nav-open") ? close() : open());

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const onInternalClick = (event: Event) => {
      const mouse = event as MouseEvent;
      if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey || mouse.button !== 0) {
        return;
      }
      const anchor = (mouse.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) {
        if (href?.startsWith("#") && (event.target as HTMLElement).closest("a")) close();
        return;
      }
      if (!href.startsWith("/")) return;
      event.preventDefault();
      close();
      navigate(href);
    };

    btn.addEventListener("click", toggle);
    backdrop.addEventListener("click", close);
    panel.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).closest("a")) close();
    });
    page.addEventListener("click", onInternalClick);
    document.addEventListener("keydown", onKeydown);

    return () => {
      btn.removeEventListener("click", toggle);
      backdrop.removeEventListener("click", close);
      page.removeEventListener("click", onInternalClick);
      document.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = "";
    };
  }, [navigate]);

  return <main dangerouslySetInnerHTML={{ __html: landingMarkup }} />;
}
