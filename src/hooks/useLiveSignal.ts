import type { ReadonlySignal } from "@preact/signals-react";
import { useSignal } from "@preact/signals-react";
import { useEffect } from "react";
import { useDeepComputed } from "./useDeepComputed";

// Converts a React prop into a stable ReadonlySignal.
// The signal is initialized with the prop value and updated via useEffect when the prop changes.
export function useLiveSignal<T>(value: T): ReadonlySignal<T> {
  const sig = useSignal(value);
  const computed = useDeepComputed(() => sig.value);
  useEffect(() => {
    sig.value = value;
  }, [value, sig]);
  return computed;
}
