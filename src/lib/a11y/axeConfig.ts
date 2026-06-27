import axe from 'axe-core'

export async function checkA11y(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
    },
  })
  if (results.violations.length > 0) {
    throw new Error(results.violations.map((v) => v.description).join('\n'))
  }
}
