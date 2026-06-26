import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('@preact/signals-react/runtime', () => ({
  useSignals: vi.fn(),
}))
