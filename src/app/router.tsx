import { useSignalEffect } from "@preact/signals-react";
import { useEffect } from "react";
import { createBrowserRouter } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Section } from "../components/layout/Section";
import { Overview } from "../components/sections/Overview";
import { TeamBreakdown } from "../components/sections/TeamBreakdown";
import {
  initFiltersFromUrl,
  syncFiltersToUrl,
} from "../lib/filters/filterSignals";

function DashboardRoute(): JSX.Element {
  useEffect(() => {
    initFiltersFromUrl();
  }, []);
  useSignalEffect(() => {
    syncFiltersToUrl();
  });

  return (
    <DashboardLayout>
      <Overview />
      <TeamBreakdown />
      <Section id="reliability" labelledBy="reliability-heading">
        <h2 id="reliability-heading">Reliability</h2>
        <p>Content coming in WP-07</p>
      </Section>
      <Section id="billing" labelledBy="billing-heading">
        <h2 id="billing-heading">Billing</h2>
        <p>Content coming in WP-08</p>
      </Section>
    </DashboardLayout>
  );
}

// WP-11 adds the /understanding route alongside this entry.
export const router = createBrowserRouter([
  { path: "/", element: <DashboardRoute /> },
]);
