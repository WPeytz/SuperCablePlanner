import { useMemo, useState } from 'react'
import type {
  ConsiderationKey,
  LayerKey,
  MapNoteData,
  Point,
} from './types'
import {
  CONFLICTS,
  CONSIDERATIONS,
  LAYERS,
  PROPOSED_ROUTES,
} from './data/mockData'
import Sidebar from './components/Sidebar'
import MapView from './components/MapView'
import RouteCard from './components/RouteCard'
import RouteComparison from './components/RouteComparison'
import ComplianceReport from './components/ComplianceReport'
import MapNote from './components/MapNote'

// initial layer visibility — everything on for an impactful first impression
const initialLayers = Object.fromEntries(LAYERS.map((l) => [l.key, true])) as Record<LayerKey, boolean>
const initialConsiderations = Object.fromEntries(
  CONSIDERATIONS.map((c) => [c.key, true]),
) as Record<ConsiderationKey, boolean>

let noteCounter = 0

export default function App() {
  const [visibleLayers, setVisibleLayers] = useState<Record<LayerKey, boolean>>(initialLayers)
  const [activeConsiderations, setActiveConsiderations] =
    useState<Record<ConsiderationKey, boolean>>(initialConsiderations)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>('route-b')

  // custom route drawing
  const [drawMode, setDrawMode] = useState(false)
  const [customRoute, setCustomRoute] = useState<Point[]>([])

  // map notes
  const [notes, setNotes] = useState<MapNoteData[]>([])
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [pendingNoteText, setPendingNoteText] = useState<string | null>(null)

  // compliance report
  const [reportOpen, setReportOpen] = useState(false)

  const selectedRoute = PROPOSED_ROUTES.find((r) => r.id === selectedRouteId) ?? null

  // group conflicts by route once
  const conflictsByRoute = useMemo(() => {
    const map: Record<string, typeof CONFLICTS> = {}
    for (const r of PROPOSED_ROUTES) map[r.id] = []
    for (const c of CONFLICTS) (map[c.routeId] ??= []).push(c)
    return map
  }, [])

  // conflicts shown on the map: those of the selected route (or all if none selected)
  const visibleConflicts = useMemo(() => {
    if (!selectedRouteId) return CONFLICTS
    return conflictsByRoute[selectedRouteId] ?? []
  }, [selectedRouteId, conflictsByRoute])

  const totalConflicts = CONFLICTS.length

  function toggleLayer(key: LayerKey) {
    setVisibleLayers((s) => ({ ...s, [key]: !s[key] }))
  }
  function toggleConsideration(key: ConsiderationKey) {
    setActiveConsiderations((s) => ({ ...s, [key]: !s[key] }))
  }

  function handleAddCustomPoint(p: Point) {
    setCustomRoute((pts) => [...pts, p])
  }
  function clearCustomRoute() {
    setCustomRoute([])
  }
  function toggleDrawMode() {
    setDrawMode((d) => {
      const next = !d
      if (next) setPendingNoteText(null) // can't draw and place notes at once
      return next
    })
  }

  function armNote(text: string) {
    setPendingNoteText(text)
    setNoteModalOpen(false)
    setDrawMode(false)
  }
  function handleAddNotePoint(p: Point) {
    if (!pendingNoteText) return
    setNotes((n) => [...n, { id: `note-${noteCounter++}`, text: pendingNoteText, position: p }])
    setPendingNoteText(null)
  }
  function removeNote(id: string) {
    setNotes((n) => n.filter((x) => x.id !== id))
  }

  return (
    <div className="app">
      <header className="topbar">
        <img className="brand-mark" src="/cable.svg" alt="" />
        <div>
          <h1>SuperCablePlanner</h1>
          <p className="subtitle">
            Decision support for routing superconducting cables in future power-hungry cities.
          </p>
        </div>
        <div className="topbar-spacer" />
        <div className="topbar-stat">
          <div className="num">{PROPOSED_ROUTES.length}</div>
          <div className="lbl">Routes</div>
        </div>
        <div className="topbar-stat">
          <div className="num" style={{ color: '#fca5a5' }}>{totalConflicts}</div>
          <div className="lbl">Conflicts</div>
        </div>
        <div className="topbar-actions" style={{ marginLeft: 14 }}>
          <button
            className="btn ghost-light"
            onClick={() => setReportOpen(true)}
            disabled={!selectedRoute}
            title={selectedRoute ? 'Generate compliance report' : 'Select a route first'}
          >
            📋 Compliance Report
          </button>
        </div>
      </header>

      <div className="workspace">
        <Sidebar
          visibleLayers={visibleLayers}
          onToggleLayer={toggleLayer}
          activeConsiderations={activeConsiderations}
          onToggleConsideration={toggleConsideration}
        />

        <main className="col-center">
          <div className="map-toolbar">
            <button className={`btn sm ${drawMode ? 'active' : ''}`} onClick={toggleDrawMode}>
              ✏️ {drawMode ? 'Drawing…' : 'Draw Route'}
            </button>
            <button className="btn sm danger" onClick={clearCustomRoute} disabled={customRoute.length === 0}>
              🗑 Clear custom
            </button>
            <button className="btn sm" onClick={() => setNoteModalOpen(true)}>
              📌 Add note
            </button>
            {pendingNoteText && (
              <span className="badge medium" style={{ alignSelf: 'center' }}>
                Click map to place note
              </span>
            )}
            <span className="hint">
              {customRoute.length > 0
                ? `Custom route: ${customRoute.length} point${customRoute.length > 1 ? 's' : ''}`
                : 'Toggle layers · click a route to inspect'}
            </span>
          </div>

          <MapView
            visibleLayers={visibleLayers}
            routes={PROPOSED_ROUTES}
            conflicts={visibleConflicts}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            drawMode={drawMode}
            customRoute={customRoute}
            onAddCustomPoint={handleAddCustomPoint}
            noteMode={!!pendingNoteText}
            notes={notes}
            onAddNotePoint={handleAddNotePoint}
            onRemoveNote={removeNote}
          />

          <RouteComparison
            routes={PROPOSED_ROUTES}
            conflictsByRoute={conflictsByRoute}
            selectedRouteId={selectedRouteId}
            activeConsiderations={activeConsiderations}
            onSelectRoute={setSelectedRouteId}
          />
        </main>

        <aside className="col col-right">
          <div className="panel">
            <h3 className="panel-title">
              Proposed routes
              <span className="count">{PROPOSED_ROUTES.length}</span>
            </h3>
            {PROPOSED_ROUTES.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                conflicts={conflictsByRoute[route.id] ?? []}
                selected={route.id === selectedRouteId}
                onSelect={() => setSelectedRouteId(route.id)}
              />
            ))}
            <button
              className="btn primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              onClick={() => setReportOpen(true)}
              disabled={!selectedRoute}
            >
              📋 Generate Compliance Report
            </button>
          </div>
        </aside>
      </div>

      {reportOpen && selectedRoute && (
        <ComplianceReport
          route={selectedRoute}
          conflicts={conflictsByRoute[selectedRoute.id] ?? []}
          activeConsiderations={activeConsiderations}
          onClose={() => setReportOpen(false)}
        />
      )}

      {noteModalOpen && <MapNote onClose={() => setNoteModalOpen(false)} onArm={armNote} />}
    </div>
  )
}
