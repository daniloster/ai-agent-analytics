import { useSignal } from '@preact/signals-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const SECTIONS = [
  { id: 'about',     label: 'About This Dashboard' },
  { id: 'premise',   label: 'Billing Model Premise' },
  { id: 'kpis',      label: 'KPI & Metric Catalog' },
  { id: 'decisions', label: 'Key Technical Decisions' },
  { id: 'tech',      label: 'Technology Choices' },
  { id: 'scope',     label: 'Scope: v1' },
  { id: 'glossary',  label: 'Glossary' },
]

export function UnderstandingSidebar(): JSX.Element {
  const activeSection = useSignal<string>('about')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeSection.value = entry.target.id
          }
        }
      },
      { threshold: 0.3 },
    )
    for (const section of SECTIONS) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }
    return () => {
      observer.disconnect()
    }
  }, [activeSection])

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 border-r bg-card p-6 overflow-y-auto z-10">
      <Link
        to="/"
        className="block text-xs text-muted-foreground hover:text-foreground mb-6"
      >
        Back to Dashboard
      </Link>
      <nav aria-label="Page navigation">
        <ul className="space-y-1">
          {SECTIONS.map((section) => {
            const isActive = activeSection.value === section.id
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? ('true' as const) : undefined}
                  className={
                    isActive
                      ? 'block text-xs font-medium text-foreground border-l-2 border-foreground pl-2 py-0.5'
                      : 'block text-xs text-muted-foreground hover:text-foreground pl-2 py-0.5'
                  }
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })
                    activeSection.value = section.id
                  }}
                >
                  {section.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
