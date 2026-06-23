import type { ConsiderationKey, Conflict, ProposedRoute } from '../types'

interface Row {
  key: ConsiderationKey | 'conflicts'
  label: string
  /** value extractor */
  value: (r: ProposedRoute) => number
  /** formatted display */
  fmt: (r: ProposedRoute) => string
  /** higher is better? */
  higherBetter: boolean
}

interface Props {
  routes: ProposedRoute[]
  conflictsByRoute: Record<string, Conflict[]>
  selectedRouteId: string | null
  activeConsiderations: Record<ConsiderationKey, boolean>
  onSelectRoute: (id: string) => void
}

/**
 * Side-by-side comparison table. Rows are filtered by the active considerations
 * from the FilterPanel; the best value in each row is starred, and the selected
 * route's column is highlighted.
 */
export default function RouteComparison({
  routes,
  conflictsByRoute,
  selectedRouteId,
  activeConsiderations,
  onSelectRoute,
}: Props) {
  const allRows: Row[] = [
    { key: 'cost', label: 'Est. cost (M DKK)', value: (r) => r.scores.cost, fmt: (r) => `${r.scores.cost}`, higherBetter: false },
    { key: 'installationTime', label: 'Install time (mo)', value: (r) => r.scores.installMonths, fmt: (r) => `${r.scores.installMonths}`, higherBetter: false },
    { key: 'publicAcceptance', label: 'Public acceptance', value: (r) => r.scores.publicAcceptance, fmt: (r) => `${r.scores.publicAcceptance}`, higherBetter: true },
    { key: 'sustainability', label: 'Sustainability', value: (r) => r.scores.sustainability, fmt: (r) => `${r.scores.sustainability}`, higherBetter: true },
    { key: 'criticalPriority', label: 'Technical feasibility', value: (r) => r.scores.feasibility, fmt: (r) => `${r.scores.feasibility}`, higherBetter: true },
    { key: 'protectedAvoidance', label: 'Conflicts (count)', value: (r) => conflictsByRoute[r.id]?.length ?? 0, fmt: (r) => `${conflictsByRoute[r.id]?.length ?? 0}`, higherBetter: false },
  ]

  // Only show rows whose consideration is active.
  const rows = allRows.filter((row) => activeConsiderations[row.key as ConsiderationKey])

  function bestId(row: Row): string {
    return routes.reduce((best, r) => {
      const bv = row.value(best)
      const rv = row.value(r)
      if (row.higherBetter ? rv > bv : rv < bv) return r
      return best
    }, routes[0]).id
  }

  return (
    <div className="panel">
      <h3 className="panel-title">Route comparison</h3>
      {rows.length === 0 ? (
        <p className="empty-hint">All considerations are excluded — enable at least one in the Considerations panel to compare routes.</p>
      ) : (
        <table className="cmp-table">
          <thead>
            <tr>
              <th></th>
              {routes.map((r) => (
                <th
                  key={r.id}
                  className={r.id === selectedRouteId ? 'col-selected' : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectRoute(r.id)}
                >
                  <div className="cmp-route-head">
                    <span className="cmp-dot" style={{ background: r.color }} />
                    {r.code}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const best = bestId(row)
              return (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  {routes.map((r) => (
                    <td
                      key={r.id}
                      className={`${r.id === selectedRouteId ? 'col-selected' : ''} ${r.id === best ? 'best' : ''}`}
                    >
                      {row.fmt(r)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      <p className="muted" style={{ marginTop: 10 }}>★ marks the best option per row · click a column to select that route.</p>
    </div>
  )
}
