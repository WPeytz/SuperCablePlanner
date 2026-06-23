import type { ConsiderationKey } from '../types'
import { CONSIDERATIONS } from '../data/mockData'

interface Props {
  active: Record<ConsiderationKey, boolean>
  onToggle: (key: ConsiderationKey) => void
}

/**
 * Lets the planner include / exclude the considerations that feed the route
 * comparison and compliance scoring. Excluded considerations are greyed out
 * and dropped from the comparison table & compliance checks.
 */
export default function FilterPanel({ active, onToggle }: Props) {
  const count = Object.values(active).filter(Boolean).length
  return (
    <div className="panel" data-tour="considerations">
      <h3 className="panel-title">
        Considerations
        <span className="count">{count}/{CONSIDERATIONS.length}</span>
      </h3>
      <p className="muted" style={{ margin: '0 0 10px' }}>
        Include or exclude factors used to compare routes.
      </p>
      {CONSIDERATIONS.map((c) => {
        const on = active[c.key]
        return (
          <div key={c.key} className="check-row" onClick={() => onToggle(c.key)}>
            <div className={`check-box ${on ? 'on' : ''}`}>{on ? '✓' : ''}</div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: on ? 'var(--ink-700)' : 'var(--ink-400)' }}>
                {c.label}
              </div>
              <div className="d" style={{ fontSize: 11, color: 'var(--ink-400)' }}>
                {c.description}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
