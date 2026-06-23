import { useEffect, useLayoutEffect, useState } from 'react'

export interface TourStep {
  /** CSS selector of the element to highlight, or null for a centered card. */
  selector: string | null
  title: string
  body: string
  icon?: string
}

interface Props {
  steps: TourStep[]
  onClose: () => void
}

const CARD_W = 340
const PAD = 8 // spotlight padding around the target
const GAP = 16 // distance from target to card

/**
 * Spotlight-style guided tour. For each step it scrolls the target element into
 * view, dims the rest of the screen, and shows a positioned card. Steps with a
 * null selector render a centered card (used for the intro / outro).
 */
export default function Tour({ steps, onClose }: Props) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[index]
  const isFirst = index === 0
  const isLast = index === steps.length - 1

  // Measure (and keep measuring) the current target.
  useLayoutEffect(() => {
    if (!step.selector) {
      setRect(null)
      return
    }
    const el = document.querySelector(step.selector)
    if (!el) {
      setRect(null)
      return
    }
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    const measure = () => setRect(el.getBoundingClientRect())
    measure()
    // re-measure after the smooth scroll settles
    const t = window.setTimeout(measure, 320)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step.selector])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function next() {
    if (isLast) onClose()
    else setIndex((i) => Math.min(i + 1, steps.length - 1))
  }
  function back() {
    setIndex((i) => Math.max(i - 1, 0))
  }

  // Compute card position
  let cardStyle: React.CSSProperties
  if (!rect) {
    cardStyle = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: CARD_W }
  } else {
    const belowSpace = window.innerHeight - rect.bottom
    const placeBelow = belowSpace > 230
    let left = rect.left + rect.width / 2 - CARD_W / 2
    left = Math.max(14, Math.min(left, window.innerWidth - CARD_W - 14))
    cardStyle = placeBelow
      ? { left, top: rect.bottom + GAP, width: CARD_W }
      : { left, top: rect.top - GAP, width: CARD_W, transform: 'translateY(-100%)' }
  }

  const spotlightStyle: React.CSSProperties | undefined = rect
    ? {
        left: rect.left - PAD,
        top: rect.top - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : undefined

  return (
    <div className="tour-overlay" onClick={onClose}>
      {rect ? <div className="tour-spotlight" style={spotlightStyle} /> : <div className="tour-fulldim" />}

      <div className="tour-card" style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div className="tour-kicker">
          <span className="tour-step-icon">{step.icon ?? '🧭'}</span>
          Step {index + 1} of {steps.length}
        </div>
        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-body">{step.body}</p>

        <div className="tour-dots">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`tour-dot ${i === index ? 'on' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>

        <div className="tour-actions">
          <button className="btn sm" onClick={onClose}>
            Skip
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button className="btn sm" onClick={back}>
                ← Back
              </button>
            )}
            <button className="btn sm primary" onClick={next}>
              {isLast ? 'Finish ✓' : isFirst ? 'Start tour →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
