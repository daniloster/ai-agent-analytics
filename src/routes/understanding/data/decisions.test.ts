import { describe, it, expect } from 'vitest'
import { KEY_DECISIONS } from './decisions'

describe('KEY_DECISIONS', () => {
  it('has exactly 15 entries', () => {
    expect(KEY_DECISIONS.length).toBe(15)
  })

  it('IDs form an unbroken sequence D-1 through D-15', () => {
    const ids = KEY_DECISIONS.map(d => d.id)
    for (let i = 1; i <= 15; i++) {
      expect(ids).toContain(`D-${i}`)
    }
  })

  it('no gaps or duplicates in IDs', () => {
    expect(new Set(KEY_DECISIONS.map(d => d.id)).size).toBe(15)
  })

  it('every entry has non-empty chosen and rationale', () => {
    for (const entry of KEY_DECISIONS) {
      expect(entry.chosen, `${entry.id} chosen`).toBeTruthy()
      expect(entry.rationale, `${entry.id} rationale`).toBeTruthy()
    }
  })

  it('every options array has at least 2 items', () => {
    for (const entry of KEY_DECISIONS) {
      expect(entry.options.length, `${entry.id} options`).toBeGreaterThanOrEqual(2)
    }
  })

  it('every entry has a non-empty decision string', () => {
    for (const entry of KEY_DECISIONS) {
      expect(entry.decision, `${entry.id} decision`).toBeTruthy()
    }
  })

  it('reversible is a boolean on every entry', () => {
    for (const entry of KEY_DECISIONS) {
      expect(typeof entry.reversible).toBe('boolean')
    }
  })
})
