import { useEffect, useRef } from 'react'
import { useSignal } from '@preact/signals-react'
import type { SectionId } from '../../lib/filters/filterSignals'

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'teams', label: 'Teams' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'billing', label: 'Billing' },
]

function getSectionFromUrl(): SectionId {
  const param = new URLSearchParams(window.location.search).get('section')
  return (SECTIONS.some((s) => s.id === param) ? param : 'overview') as SectionId
}

function setSectionInUrl(id: SectionId): void {
  const sp = new URLSearchParams(window.location.search)
  sp.set('section', id)
  window.history.replaceState({}, '', '?' + sp.toString())
}

export function SectionNav(): JSX.Element {
  const activeSection = useSignal<SectionId>(getSectionFromUrl())
  // IO fires immediately on mount for visible elements — ignore until user scrolls.
  const userHasScrolled = useRef(false)

  useEffect(() => {
    const onScroll = () => { userHasScrolled.current = true }
    window.addEventListener('scroll', onScroll, { once: true, passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!userHasScrolled.current) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id as SectionId
            activeSection.value = id
            setSectionInUrl(id)
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
  }, [activeSection, userHasScrolled])

  return (
    <nav aria-label="Dashboard navigation" className="flex border-b border-border bg-card px-8">
      <ul aria-label="Dashboard sections" className="flex">
        {SECTIONS.map((s) => {
          const isActive = activeSection.value === s.id
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? ('true' as const) : undefined}
                className={[
                  'px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                  isActive
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-muted-foreground hover:text-zinc-700',
                ].join(' ')}
                onClick={(e) => {
                  e.preventDefault()
                  userHasScrolled.current = true
                  activeSection.value = s.id
                  setSectionInUrl(s.id)
                  if (s.id === 'overview') {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
              >
                {s.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
