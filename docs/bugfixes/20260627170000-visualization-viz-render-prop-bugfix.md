# Bugfix Specification: Visualization Viz Render-Prop Pattern + Complete VisMark
**Timestamp:** 20260627170000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The `Visualization` children render prop receives a `marks` argument (typed as `VisMark`) but all 5 consumers ignore it entirely, importing chart components directly. This breaks static typing: TypeScript cannot verify that the components used inside the render prop are compatible with the data/axis types of the specific `Visualization` instance. Additionally `VisMark` is incomplete - 6 components used in practice (`AreaChart`, `SparklineChart`, `ColumnChart`, `ColumnTrendLine`, `SeriesTooltip`, `DataLabels`) are not in the type, forcing consumers to bypass the type-safe channel.
- **Accessibility (a11y) Impact:** Pure refactor - no ARIA or DOM changes.

### 2. Technical Specification
- **Root Cause:** `VisMark` was defined with only the primitive marks (`Line`, `Area`, `Bar`, `Gauge`, `HeatmapMark`, `Annotation`). Higher-level wrappers (`AreaChart`, `ColumnChart`, `SparklineChart`) and overlay components (`SeriesTooltip`, `DataLabels`, `ColumnTrendLine`) were never added. Consumers therefore import these directly and use `{() => ...}` ignoring the argument.
- **Compliance Check:** All changes are in existing files + Visualization.tsx. No new files. No class components. No `any`. Complies with ARCHITECTURE.md and CLAUDE.md.

### 3. Implementation Plan
- **`src/components/charts/Visualization.tsx`**:
  - Add imports: `AreaChart`, `SparklineChart`, `ColumnChart`, `ColumnTrendLine`, `SeriesTooltip`, `DataLabels`, plus their prop types.
  - Expand `VisMark<TData, TAxisId>` with all 6 missing members.
  - Add all 6 to `VIS_MARKS` singleton.
  - Rename `children` param from `marks` to `Viz` in the type signature.
- **All 5 consumers** (`Reliability.tsx`, `Overview.tsx`, `Billing.tsx`, `TeamBreakdown.tsx`, `TeamTable.tsx`):
  - Change `{() => (...)}` → `{(Viz) => (...)}`.
  - Replace all direct component references with `Viz.X`.
  - Remove now-redundant direct imports.
- **File Name & Structural Hygiene:** No renames needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:** Add test in `Visualization.test.tsx`: capture the `Viz` argument and assert all new members are functions (`SeriesTooltip`, `DataLabels`, `ColumnChart`, `SparklineChart`, `ColumnTrendLine`, `AreaChart`).
- **Regression Strategy:** `npm run test` + `npx tsc --noEmit`
