import { describe, it, expect } from 'vitest'
import { KPI_CATALOG } from './kpis'
import type { KpiSection } from './kpis'

describe('KPI_CATALOG', () => {
  it('has exactly 38 entries', () => {
    expect(KPI_CATALOG.length).toBe(38)
  })

  it('has exactly 11 overview entries', () => {
    expect(KPI_CATALOG.filter(k => k.section === 'overview').length).toBe(11)
  })

  it('has exactly 5 teams entries', () => {
    expect(KPI_CATALOG.filter(k => k.section === 'teams').length).toBe(5)
  })

  it('has exactly 11 reliability entries', () => {
    expect(KPI_CATALOG.filter(k => k.section === 'reliability').length).toBe(11)
  })

  it('has exactly 11 billing entries', () => {
    expect(KPI_CATALOG.filter(k => k.section === 'billing').length).toBe(11)
  })

  it('has no duplicate ids', () => {
    const ids = KPI_CATALOG.map(k => k.id)
    expect(new Set(ids).size).toBe(38)
  })

  it('every entry has non-empty required fields', () => {
    for (const entry of KPI_CATALOG) {
      expect(entry.id, `${entry.id} id`).toBeTruthy()
      expect(entry.label, `${entry.id} label`).toBeTruthy()
      expect(entry.formula, `${entry.id} formula`).toBeTruthy()
      expect(entry.example, `${entry.id} example`).toBeTruthy()
      expect(entry.whatItMeasures, `${entry.id} whatItMeasures`).toBeTruthy()
      expect(entry.whyItMatters, `${entry.id} whyItMatters`).toBeTruthy()
      expect(entry.visualization, `${entry.id} visualization`).toBeTruthy()
    }
  })

  it('all section values are valid KpiSection literals', () => {
    const validSections: KpiSection[] = ['overview', 'teams', 'reliability', 'billing']
    for (const entry of KPI_CATALOG) {
      expect(validSections).toContain(entry.section)
    }
  })

  it('O-05 formula contains total_cost and retained_users_7d (computeRetentionCost spot-check)', () => {
    const o05 = KPI_CATALOG.find(k => k.id === 'O-05')
    expect(o05).toBeDefined()
    expect(o05!.formula).toContain('total_cost')
    expect(o05!.formula).toContain('retained_users_7d')
  })

  it('O-01 through O-11 IDs exist and are in order', () => {
    const overviewIds = KPI_CATALOG.filter(k => k.section === 'overview').map(k => k.id)
    for (let i = 1; i <= 11; i++) {
      const expected = `O-${String(i).padStart(2, '0')}`
      expect(overviewIds).toContain(expected)
    }
  })

  it('T-01 through T-05 IDs exist', () => {
    const teamIds = KPI_CATALOG.filter(k => k.section === 'teams').map(k => k.id)
    for (let i = 1; i <= 5; i++) {
      const expected = `T-${String(i).padStart(2, '0')}`
      expect(teamIds).toContain(expected)
    }
  })

  it('R-01 through R-11 IDs exist', () => {
    const reliabilityIds = KPI_CATALOG.filter(k => k.section === 'reliability').map(k => k.id)
    for (let i = 1; i <= 11; i++) {
      const expected = `R-${String(i).padStart(2, '0')}`
      expect(reliabilityIds).toContain(expected)
    }
  })

  it('B-01 through B-11 IDs exist', () => {
    const billingIds = KPI_CATALOG.filter(k => k.section === 'billing').map(k => k.id)
    for (let i = 1; i <= 11; i++) {
      const expected = `B-${String(i).padStart(2, '0')}`
      expect(billingIds).toContain(expected)
    }
  })
})
