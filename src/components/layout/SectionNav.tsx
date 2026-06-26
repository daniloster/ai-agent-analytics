import { useEffect } from 'react'
import { useSignal } from '@preact/signals-react'
import type { SectionId } from '../../lib/filters/filterSignals'

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'teams', label: 'Teams' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'billing', label: 'Billing' },
]

export function SectionNav(): JSX.Element {
  const activeSection = useSignal<SectionId>('overview')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeSection.value = entry.target.id as SectionId
          }
        }
      },
      { threshold: 0.4 },
    )
    for (const section of SECTIONS) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }
    return () => { observer.disconnect() }
  }, [activeSection])

  return (
    <nav>
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-current={activeSection.value === s.id ? 'true' : undefined}
          className={
            activeSection.value === s.id
              ? 'text-primary font-medium'
              : 'text-muted-foreground'
          }
          onClick={(e) => {
            e.preventDefault()
            document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          {s.label}
        </a>
      ))}
    </nav>
  )
}
