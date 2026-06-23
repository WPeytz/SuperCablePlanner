import type { Conflict, ProposedRoute } from '../types'

function scoreColor(v: number): string {
  if (v >= 80) return '#16a34a'
  if (v >= 65) return '#65a30d'
  if (v >= 50) return '#f59e0b'
  return '#dc2626'
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-bar-row">
      <span className="sb-label">{label}</span>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${value}%`, background: scoreColor(value) }} />
      </div>
      <span className="sb-val">{value}</span>
    </div>
  )
}

interface Props {
  route: ProposedRoute
  conflicts: Conflict[]
  selected: boolean
  onSelect: () => void
}

export default function RouteCard({ route, conflicts, selected, onSelect }: Props) {
  const { scores } = route
  return (
    <div className={`route-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="route-card-head">
        <div className="route-chip" style={{ background: route.color }}>
          {route.code}
        </div>
        <div>
          <div className="rc-name">{route.name}</div>
          <div className="rc-tag">{route.tagline}</div>
        </div>
        {conflicts.length > 0 && (
          <span className="route-conflict-pill">
            ⚠ {conflicts.length}
          </span>
        )}
      </div>

      <div className="metric-grid">
        <div className="metric">
          <span className="m-label">Est. cost</span>
          <span className="m-value">{scores.cost} M DKK</span>
        </div>
        <div className="metric">
          <span className="m-label">Install time</span>
          <span className="m-value">{scores.installMonths} mo</span>
        </div>
      </div>

      <ScoreBar label="Public accept." value={scores.publicAcceptance} />
      <ScoreBar label="Feasibility" value={scores.feasibility} />
      <ScoreBar label="Sustainability" value={scores.sustainability} />

      {selected && (
        <>
          <div className="route-detail-section">
            <h5>Main reasoning</h5>
            <p>{route.reasoning}</p>
          </div>
          <div className="route-detail-section">
            <h5>Main risks</h5>
            <ul className="risk-list">
              {route.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          {conflicts.length > 0 && (
            <div className="route-detail-section">
              <h5>Detected conflicts</h5>
              {conflicts.map((c) => (
                <div key={c.id} className="conflict-item">
                  <span className="ci-icon">⚠️</span>
                  <div>
                    <div className="ci-title">
                      {c.title}
                      <span className={`badge ${c.severity}`}>{c.severity}</span>
                    </div>
                    <div className="ci-detail">{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
