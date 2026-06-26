import { describe, it, expect } from 'vitest'
import { hashString, createSeededFaker } from './seed'

describe('hashString', () => {
  it('returns the same number for the same input', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
  })

  it('returns different numbers for inputs differing by one character', () => {
    expect(hashString('abc')).not.toBe(hashString('abd'))
  })

  it('returns a non-negative integer for an empty string', () => {
    const result = hashString('')
    expect(result).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('return value is always in range [0, 2^32 - 1]', () => {
    const inputs = ['', 'abc', 'hello world', '2026-06-01', '2026-06-30team_platform']
    for (const input of inputs) {
      const result = hashString(input)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(4294967295)
    }
  })
})

describe('createSeededFaker', () => {
  it('returns a Faker instance with a number.int method', () => {
    const faker = createSeededFaker('2026-06-01', '2026-06-30', undefined)
    expect(typeof faker.number.int).toBe('function')
  })

  it('two calls with identical params produce the same first random value', () => {
    const f1 = createSeededFaker('2026-06-01', '2026-06-30', undefined)
    const f2 = createSeededFaker('2026-06-01', '2026-06-30', undefined)
    expect(f1.number.int()).toBe(f2.number.int())
  })

  it('teamId = undefined vs teamId = team_001 produce different seeds', () => {
    const f1 = createSeededFaker('2026-06-01', '2026-06-30', undefined)
    const f2 = createSeededFaker('2026-06-01', '2026-06-30', 'team_001')
    expect(f1.number.int()).not.toBe(f2.number.int())
  })
})
