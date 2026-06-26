import { http, HttpResponse } from 'msw'
import { createSeededFaker } from './seed'
import { generateOverview } from './generators/overview'
import { generateTeams } from './generators/teams'
import { generateReliability } from './generators/reliability'
import { generateBilling } from './generators/billing'
import { generateTimeseries } from './generators/timeseries'
import { generateTeamsList, generateOrgConfig } from './generators/org'
import type { FilterParams } from '../../types/api'

function parseParams(url: URL): FilterParams | null {
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (!from || !to) return null
  if (from > to) return null
  const teamId = url.searchParams.get('team_id') ?? undefined
  return { from, to, team_id: teamId }
}

export const handlers = [
  http.get('*/api/org/teams', () => {
    return HttpResponse.json(generateTeamsList())
  }),

  http.get('*/api/org/config', () => {
    return HttpResponse.json(generateOrgConfig())
  }),

  http.get('*/api/analytics/overview', ({ request }) => {
    const params = parseParams(new URL(request.url))
    if (!params) return HttpResponse.json({ error: 'Invalid date range' }, { status: 400 })
    const faker = createSeededFaker(params.from, params.to, params.team_id)
    return HttpResponse.json(generateOverview(faker, params))
  }),

  http.get('*/api/analytics/teams', ({ request }) => {
    const params = parseParams(new URL(request.url))
    if (!params) return HttpResponse.json({ error: 'Invalid date range' }, { status: 400 })
    const faker = createSeededFaker(params.from, params.to, params.team_id)
    return HttpResponse.json(generateTeams(faker, params))
  }),

  http.get('*/api/analytics/reliability', ({ request }) => {
    const params = parseParams(new URL(request.url))
    if (!params) return HttpResponse.json({ error: 'Invalid date range' }, { status: 400 })
    const faker = createSeededFaker(params.from, params.to, params.team_id)
    return HttpResponse.json(generateReliability(faker, params))
  }),

  http.get('*/api/analytics/billing', ({ request }) => {
    const params = parseParams(new URL(request.url))
    if (!params) return HttpResponse.json({ error: 'Invalid date range' }, { status: 400 })
    const faker = createSeededFaker(params.from, params.to, params.team_id)
    return HttpResponse.json(generateBilling(faker, params))
  }),

  http.get('*/api/analytics/timeseries', ({ request }) => {
    const params = parseParams(new URL(request.url))
    if (!params) return HttpResponse.json({ error: 'Invalid date range' }, { status: 400 })
    const faker = createSeededFaker(params.from, params.to, params.team_id)
    return HttpResponse.json(generateTimeseries(faker, params))
  }),
]
