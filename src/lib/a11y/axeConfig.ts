import axe from 'axe-core'

// Reduced-motion scan (WP-09 T-6): bare transition-colors in SectionNav.tsx and
// animate-pulse in SectionSkeleton.tsx were prefixed with motion-safe: in this task.
// src/components/charts/ had no bare transition-* or animate-* classes.

export async function checkA11y(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      // color-contrast is disabled: JSDOM cannot compute CSS custom properties or use
      // HTMLCanvasElement.getContext, so results are unreliable and cause test timeouts.
      'color-contrast': { enabled: false },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
    },
  })
  if (results.violations.length > 0) {
    throw new Error(results.violations.map((v) => v.description).join('\n'))
  }
}
