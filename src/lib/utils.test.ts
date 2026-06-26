import { it, expect } from 'vitest'
import { cn } from './utils'

it('cn merges class strings', () => {
  expect(cn('a', 'b')).toBe('a b')
})

it('cn deduplicates conflicting tailwind classes (tailwind-merge)', () => {
  expect(cn('px-2', 'px-4')).toBe('px-4')
})

it('cn filters falsy values (clsx)', () => {
  expect(cn('a', false && 'b', 'c')).toBe('a c')
})
