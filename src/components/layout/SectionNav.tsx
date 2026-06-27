import { useSignal } from "@preact/signals-react";
import { useEffect, useRef } from "react";
import type { SectionId } from "../../lib/filters/filterSignals";

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "teams", label: "Teams" },
  { id: "reliability", label: "Reliability" },
  { id: "billing", label: "Billing" },
];

function getSectionFromUrl(): SectionId {
  const param = new URLSearchParams(window.location.search).get("section");
  return (
    SECTIONS.some((s) => s.id === param) ? param : "overview"
  ) as SectionId;
}

function setSectionInUrl(id: SectionId): void {
  const sp = new URLSearchParams(window.location.search);
  sp.set("section", id);
  window.history.replaceState({}, "", "?" + sp.toString());
}

export function SectionNav(): JSX.Element {
  const activeSection = useSignal<SectionId>(getSectionFromUrl());
  // IO fires immediately on mount for visible elements — ignore until user scrolls.
  const userHasScrolled = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      userHasScrolled.current = true;
      // IO won't re-fire for Overview if it never left the viewport (minimal scroll).
      // When scrollY is near the top, force-reset to Overview as the active section.
      if (window.scrollY < 100) {
        activeSection.value = "overview";
        setSectionInUrl("overview");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeSection]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!userHasScrolled.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id as SectionId;
            activeSection.value = id;
            setSectionInUrl(id);
          }
        }
      },
      { threshold: 0.4 },
    );
    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => {
      observer.disconnect();
    };
  }, [activeSection, userHasScrolled]);

  return (
    <nav
      aria-label="Dashboard navigation"
      className="flex overflow-x-auto border-b border-border bg-card px-4 sm:px-8"
    >
      <ul aria-label="Dashboard sections" className="flex">
        {SECTIONS.map((s) => {
          const isActive = activeSection.value === s.id;
          return (
            <li key={s.id} className="flex">
              <a
                href={`#${s.id}`}
                aria-current={isActive ? ("true" as const) : undefined}
                className={[
                  "px-4 py-3 text-[13px] font-medium border-b-2 -mb-px motion-safe:transition-colors",
                  isActive
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-muted-foreground hover:text-zinc-700",
                ].join(" ")}
                onClick={(e) => {
                  e.preventDefault();
                  userHasScrolled.current = true;
                  activeSection.value = s.id;
                  setSectionInUrl(s.id);
                  if (s.id === "overview") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    document
                      .getElementById(s.id)
                      ?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
