import { useEffect } from 'react'
import { useSignalEffect } from '@preact/signals-react'
import { createBrowserRouter } from 'react-router-dom'
import { initFiltersFromUrl, syncFiltersToUrl } from '../lib/filters/filterSignals'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Section } from '../components/layout/Section'

function DashboardRoute(): JSX.Element {
  useEffect(() => { initFiltersFromUrl() }, [])
  useSignalEffect(() => { syncFiltersToUrl() })

  return (
    <DashboardLayout>
      <Section id="overview" labelledBy="overview-heading">
        <h2 id="overview-heading">Overview</h2>
        <p>Content coming in WP-05</p>
      </Section>
      <Section id="teams" labelledBy="teams-heading">
        <h2 id="teams-heading">Teams</h2>
        <p>Content coming in WP-06</p>
      </Section>
      <Section id="reliability" labelledBy="reliability-heading">
        <h2 id="reliability-heading">Reliability</h2>
        <p>Content coming in WP-07</p>
      </Section>
      <Section id="billing" labelledBy="billing-heading">
        <h2 id="billing-heading">Billing</h2>
        <p>Content coming in WP-08</p>
      </Section>
    </DashboardLayout>
  )
}

// WP-11 adds the /understanding route alongside this entry.
export const router = createBrowserRouter([
  { path: '/', element: <DashboardRoute /> },
])
