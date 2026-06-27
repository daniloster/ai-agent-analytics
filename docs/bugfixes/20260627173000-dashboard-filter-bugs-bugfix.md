# Bugfix Specification: Dashboard Filter Bugs
**Timestamp:** 20260627173000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** Two Dashboard filter controls are broken. The team selector shows no label when no team is selected, making it impossible to tell the current state. The date range picker shows nothing when clicked because the popover never opens.
- **Accessibility (a11y) Impact:** The combobox trigger with no visible label fails WCAG 1.4.1 (use of color) and WCAG 4.1.3 (status messages) - a screen reader user cannot determine the current filter state. The popover trigger that silently fails means keyboard and mouse users both cannot change the date range.

### 2. Technical Specification
- **Root Cause (Bug 1 - TeamSelector):** Radix UI `Select` does not support `""` (empty string) as a `SelectItem` value. The code passes `value=""` to both the `Select` root and the "All teams" `SelectItem`. Radix treats empty string as "nothing selected", so `SelectValue` finds no matching item and renders blank. The fix is to use a non-empty sentinel value `"__all__"` for the "All teams" item and map it to `undefined` in the signal.
- **Root Cause (Bug 2 - DateRangePicker):** `Button` is a plain function component, not wrapped with `React.forwardRef`. `PopoverTrigger asChild` uses Radix UI's `Slot` primitive, which clones the child and passes a `ref` down. Without `forwardRef`, the `ref` is lost, the trigger element is never registered with the Popover, and clicking it does nothing. React logs a "Function components cannot be given refs" warning (visible in test stderr).
- **Compliance Check:** Both fixes are additive/minimal. `forwardRef` on Button is required by ARCHITECTURE.md component contracts when the component is used as a Radix `asChild` target. Sentinel value is an internal implementation detail with no API surface change.

### 3. Implementation Plan
- **`src/components/ui/button.tsx`** - Wrap Button with `React.forwardRef`, forward `ref` to the inner `<button>`. Add `Button.displayName = 'Button'`.
- **`src/components/filters/TeamSelector.tsx`** - Replace `value=""` sentinel with `"__all__"`. Update `value` prop: `teamId.value ?? '__all__'`. Update `onValueChange`: `v === '__all__' ? undefined : v`. Update `SelectItem` to `value="__all__"`.
- **`src/components/filters/TeamSelector.test.tsx`** - Add test: "trigger textContent includes 'All teams' when teamId is undefined".
- **File System Hygiene Re-evaluation:** No renames required. File responsibilities are unchanged.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `TeamSelector`: combobox trigger shows "All teams" when `teamId.value` is `undefined` (before any selection).
- **Regression Strategy:**
  ```bash
  npm run test
  ```
