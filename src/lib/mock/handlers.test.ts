// @vitest-environment node
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

const server = setupServer(...handlers)
const BASE = 'http://localhost'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('GET /api/org/teams', () => {
  it('returns 200 with an array of 4 teams', async () => {
    const res = await fetch(`${BASE}/api/org/teams`)
    expect(res.status).toBe(200)
    const data = await res.json() as unknown[]
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(4)
    const first = data[0] as Record<string, unknown>
    expect(typeof first.id).toBe('string')
    expect(typeof first.name).toBe('string')
    expect(typeof first.seat_count).toBe('number')
    expect(typeof first.member_count).toBe('number')
  })
})

describe('GET /api/org/config', () => {
  it('returns 200 with billing_model hybrid_token_seat', async () => {
    const res = await fetch(`${BASE}/api/org/config`)
    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect(data.billing_model).toBe('hybrid_token_seat')
  })
})

describe('GET /api/analytics/overview', () => {
  const url = `${BASE}/api/analytics/overview?from=2026-06-01&to=2026-06-30`

  it('returns 200 with all required top-level fields', async () => {
    const res = await fetch(url)
    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect(data.period).toBeDefined()
    expect(typeof data.total_runs).toBe('number')
    expect(typeof data.mau).toBe('number')
    expect(typeof data.total_cost).toBe('number')
    expect(typeof data.success_rate).toBe('number')
    expect(Array.isArray(data.quality_score_trend)).toBe(true)
  })

  it('returns 400 when from > to', async () => {
    const res = await fetch(`${BASE}/api/analytics/overview?from=2026-06-30&to=2026-06-01`)
    expect(res.status).toBe(400)
  })

  it('returns 400 when from param is missing', async () => {
    const res = await fetch(`${BASE}/api/analytics/overview?to=2026-06-30`)
    expect(res.status).toBe(400)
  })

  it('same URL called twice returns identical JSON bodies', async () => {
    const [r1, r2] = await Promise.all([fetch(url), fetch(url)])
    const [d1, d2] = await Promise.all([r1.text(), r2.text()])
    expect(d1).toBe(d2)
  })
})

describe('GET /api/analytics/teams', () => {
  it('returns 200 with teams array of length 4', async () => {
    const res = await fetch(`${BASE}/api/analytics/teams?from=2026-06-01&to=2026-06-30`)
    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect(Array.isArray(data.teams)).toBe(true)
    expect((data.teams as unknown[]).length).toBe(4)
  })
})

describe('GET /api/analytics/reliability', () => {
  it('returns 200 with availability_by_day length 30', async () => {
    const res = await fetch(`${BASE}/api/analytics/reliability?from=2026-06-01&to=2026-06-30`)
    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect((data.availability_by_day as unknown[]).length).toBe(30)
  })
})

describe('GET /api/analytics/billing', () => {
  it('returns 200 with invoice_history length 6', async () => {
    const res = await fetch(`${BASE}/api/analytics/billing?from=2026-06-01&to=2026-06-30`)
    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect((data.invoice_history as unknown[]).length).toBe(6)
  })
})

describe('GET /api/analytics/timeseries', () => {
  it('returns 200 with points length 30', async () => {
    const res = await fetch(`${BASE}/api/analytics/timeseries?from=2026-06-01&to=2026-06-30`)
    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect((data.points as unknown[]).length).toBe(30)
  })
})
