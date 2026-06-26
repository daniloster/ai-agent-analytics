import { useRef, useEffect } from 'react'
import { useSignal } from '@preact/signals-react'
import type { SectionId } from '../../lib/filters/filterSignals'
import { SectionSkeleton } from './SectionSkeleton'

interface SectionProps {
  id: SectionId
  labelledBy: string
  children: React.ReactNode
}

export function Section({ id, labelledBy, children }: SectionProps): JSX.Element {
  const ref = useRef<HTMLElement>(null)
  const mounted = useSignal(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            mounted.value = true
            observer.disconnect()
          }
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => { observer.disconnect() }
  }, [mounted])

  return (
    <section id={id} aria-labelledby={labelledBy} ref={ref} style={{ scrollMarginTop: '104px' }}>
      {mounted.value ? children : <SectionSkeleton />}
    </section>
  )
}
