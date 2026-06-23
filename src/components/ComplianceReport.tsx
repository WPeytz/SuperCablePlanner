import type { ConsiderationKey, Conflict, ProposedRoute, ProtectedZone } from '../types'
import { PROTECTED_ZONES } from '../data/mockData'

interface Props {
  route: ProposedRoute
  conflicts: Conflict[]
  activeConsiderations: Record<ConsiderationKey, boolean>
  onClose: () => void
}

interface CheckResult {
  label: string
  pass: boolean
  note: string
}

/**
 * Generates a mock compliance report for the selected route. All findings are
 * derived from the route's conflicts + the active considerations, so the report
 * reflects what the planner currently has switched on.
 */
export default function ComplianceReport({ route, conflicts, activeConsiderations, onClose }: Props) {
  const protectedConflicts = conflicts.filter((c) => c.kind === 'protectedZone')
  const utilityConflicts = conflicts.filter((c) => c.kind === 'utilityConflict')
  const criticalConflicts = conflicts.filter((c) => c.kind === 'criticalProximity')
  const roadworkConflicts = conflicts.filter((c) => c.kind === 'roadwork')
  const rangeConflicts = conflicts.filter((c) => c.kind === 'segmentRange')

  const checks: CheckResult[] = [
    {
      label: 'Protected zone avoidance',
      pass: protectedConflicts.length === 0,
      note: protectedConflicts.length === 0 ? 'No protected zones intersected.' : `${protectedConflicts.length} protected-zone intersection(s) detected.`,
    },
    {
      label: 'Underground utility clearance',
      pass: utilityConflicts.length === 0,
      note: utilityConflicts.length === 0 ? 'No conflicts with water, gas, metro or legacy cables.' : `${utilityConflicts.length} utility conflict(s) require coordination.`,
    },
    {
      label: 'Critical infrastructure clearance',
      pass: criticalConflicts.length === 0,
      note: criticalConflicts.length === 0 ? 'Maintains clearance from hospitals & emergency loads.' : `${criticalConflicts.length} close approach(es) to critical infrastructure.`,
    },
    {
      label: 'Roadwork coordination',
      pass: roadworkConflicts.length === 0,
      note: roadworkConflicts.length === 0 ? 'No overlap with scheduled civil works.' : `${roadworkConflicts.length} overlap(s) with planned roadworks.`,
    },
    {
      label: 'Cable segment range',
      pass: rangeConflicts.length === 0,
      note: rangeConflicts.length === 0 ? 'All segments within recommended cooling-section length.' : `${rangeConflicts.length} segment(s) exceed the recommended range.`,
    },
  ]

  const avoidedZones = PROTECTED_ZONES.filter(
    (z) => !protectedConflicts.some((c) => c.detail.includes(z.name.split(' ')[0])),
  )
  const notAvoided = PROTECTED_ZONES.filter((z) => !avoidedZones.includes(z))

  const passCount = checks.filter((c) => c.pass).length
  const acceptance = route.scores.publicAcceptance
  const overall = passCount === checks.length ? 'Compliant' : passCount >= 3 ? 'Conditional' : 'High-risk'
  const activeCount = Object.values(activeConsiderations).filter(Boolean).length

  function recommendation(): string {
    if (overall === 'Compliant') {
      return `Route ${route.code} (${route.name}) clears all checked constraints and is recommended for detailed engineering design. With a public acceptance estimate of ${acceptance}%, proceed to stakeholder consultation.`
    }
    if (overall === 'Conditional') {
      return `Route ${route.code} (${route.name}) is viable but ${checks.length - passCount} constraint(s) require mitigation before approval. Resolve the flagged conflicts — prioritizing protected-zone and critical-infrastructure items — then re-run compliance. Estimated public acceptance: ${acceptance}%.`
    }
    return `Route ${route.code} (${route.name}) carries significant unresolved conflicts and is not recommended in its current alignment. Consider an alternative corridor or substantial rerouting before further design work.`
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontSize: 22 }}>📋</span>
          <div>
            <h2>Compliance Report</h2>
            <div className="muted">Generated · mock assessment for presentation</div>
          </div>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="report-route-banner" style={{ background: route.color }}>
            <div className="route-chip" style={{ background: 'rgba(255,255,255,0.22)' }}>{route.code}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{route.name}</div>
              <div style={{ fontSize: 12.5, opacity: 0.9 }}>{route.tagline}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.05em' }}>Status</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{overall}</div>
            </div>
          </div>

          <div className="report-section">
            <h4>🔎 Key constraints checked</h4>
            <ul className="check-list">
              {checks.map((c) => (
                <li key={c.label}>
                  <span className={`tick ${c.pass ? 'pass' : 'fail'}`}>{c.pass ? '✓' : '✕'}</span>
                  <div>
                    <strong>{c.label}</strong>
                    <div className="muted">{c.note}</div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="muted" style={{ marginTop: 8 }}>
              {passCount}/{checks.length} constraints passed · {activeCount} consideration(s) currently weighted.
            </p>
          </div>

          <div className="report-section">
            <h4>⚠️ Conflicts detected</h4>
            {conflicts.length === 0 ? (
              <p style={{ fontSize: 13 }}>No conflicts detected for this route.</p>
            ) : (
              conflicts.map((c) => (
                <div key={c.id} className="conflict-item">
                  <span className="ci-icon">⚠️</span>
                  <div>
                    <div className="ci-title">
                      {c.title} <span className={`badge ${c.severity}`}>{c.severity}</span>
                    </div>
                    <div className="ci-detail">{c.detail}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="report-section">
            <h4>🛡️ Protected zones</h4>
            <ZoneList title="Avoided" zones={avoidedZones} pass />
            {notAvoided.length > 0 && <ZoneList title="Not avoided" zones={notAvoided} pass={false} />}
          </div>

          <div className="report-section">
            <h4>👥 Public acceptance estimate</h4>
            <div className="acceptance-gauge">
              <div className="gauge-num" style={{ color: acceptance >= 75 ? 'var(--good)' : acceptance >= 60 ? 'var(--warn)' : 'var(--bad)' }}>
                {acceptance}%
              </div>
              <div className="score-track" style={{ height: 12 }}>
                <div className="score-fill" style={{ width: `${acceptance}%`, background: acceptance >= 75 ? 'var(--good)' : acceptance >= 60 ? 'var(--warn)' : 'var(--bad)' }} />
              </div>
            </div>
          </div>

          <div className="report-section" style={{ marginBottom: 0 }}>
            <h4>✅ Recommendation summary</h4>
            <div className="recommendation">{recommendation()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ZoneList({ title, zones, pass }: { title: string; zones: ProtectedZone[]; pass: boolean }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: pass ? 'var(--good)' : 'var(--bad)', marginBottom: 4 }}>
        {pass ? '✓' : '✕'} {title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {zones.map((z) => (
          <span key={z.id} className={`badge ${pass ? 'good' : 'high'}`}>
            {z.name}
          </span>
        ))}
      </div>
    </div>
  )
}
