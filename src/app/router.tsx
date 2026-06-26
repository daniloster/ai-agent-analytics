import { useSignalEffect } from "@preact/signals-react";
import { useEffect } from "react";
import { createBrowserRouter } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Section } from "../components/layout/Section";
import { Overview } from "../components/sections/Overview";
import { TeamBreakdown } from "../components/sections/TeamBreakdown";
import { Reliability } from "../components/sections/Reliability";
import { Billing } from "../components/sections/Billing";
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
      <Reliability />
      <Billing />
    </DashboardLayout>
  );
}

// WP-11 adds the /understanding route alongside this entry.
export const router = createBrowserRouter([
  { path: "/", element: <DashboardRoute /> },
]);
