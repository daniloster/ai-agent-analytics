import { useSignals as useRuntimeSignals } from '@preact/signals-react/runtime'

// Thin wrapper so the babel-signals-transformer imports a stable local path.
// Allows the runtime to be updated independently of the transformer's import.
export function useSignals(): void {
  useRuntimeSignals()
}
