const EMPTY_ARRAY: unknown[] = [];
export function orEmptyArray<TItem>(arr: TItem[] | null | undefined): TItem[] {
  if (!arr) return EMPTY_ARRAY as TItem[];

  return arr;
}
