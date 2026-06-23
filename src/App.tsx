import { useEffect, useMemo, useState } from 'react'
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
import Tour from './components/Tour'
import type { TourStep } from './components/Tour'

const TOUR_SEEN_KEY = 'scp.tourSeen.v1'

const TOUR_STEPS: TourStep[] = [
  {
    selector: null,
    icon: '⚡',
    title: 'Welcome to SuperCablePlanner',
    body: 'A decision-support prototype for routing superconducting power cables across a city. This quick tour shows you around — use the ← → arrow keys or the buttons to move through it.',
  },
  {
    selector: '[data-tour="map"]',
    icon: '🗺️',
    title: 'The planning map',
    body: 'A stylized map of Copenhagen with city blocks, streets, water, the existing grid and key infrastructure. Hover any icon, zone or line for details, and click a coloured route to inspect it.',
  },
  {
    selector: '[data-tour="layers"]',
    icon: '🔀',
    title: 'Map layers',
    body: 'Switch layers on and off to focus the map — existing cables, heavy electricity users, hospitals, protected zones, roadworks, underground utilities, proposed routes and conflict warnings.',
  },
  {
    selector: '[data-tour="considerations"]',
    icon: '⚖️',
    title: 'Considerations',
    body: 'Include or exclude the factors used to score the routes. Turning one off removes it from the comparison table — so you can weigh options around what matters most for your project.',
  },
  {
    selector: '[data-tour="legend"]',
    icon: '🧭',
    title: 'Legend',
    body: 'A key to every symbol, line style and zone colour on the map — handy as a reference while you present.',
  },
  {
    selector: '[data-tour="routes"]',
    icon: '🛣️',
    title: 'Proposed routes',
    body: 'Three candidate corridors — shortest, most sustainable, and highest-reliability. Click a card to select it: the map highlights that route and its conflicts, and the card expands with reasoning and risks.',
  },
  {
    selector: '[data-tour="comparison"]',
    icon: '📊',
    title: 'Route comparison',
    body: 'A side-by-side table of the routes. The best value in each row is starred ★ and the selected route’s column is highlighted. Click a column header to select that route.',
  },
  {
    selector: '[data-tour="toolbar"]',
    icon: '✏️',
    title: 'Draw & annotate',
    body: 'Use “Draw Route” to sketch your own corridor by clicking points on the map (Clear removes it), and “Add note” to drop a labelled annotation anywhere on the map.',
  },
  {
    selector: '[data-tour="report"]',
    icon: '📋',
    title: 'Compliance report',
    body: 'Generate a mock compliance report for the selected route — constraint checks, detected conflicts, protected zones avoided, a public-acceptance estimate and a recommendation summary.',
  },
  {
    selector: null,
    icon: '✅',
    title: 'You’re ready to plan',
    body: 'That’s the whole workflow. Replay this tour anytime from the “?” button in the top-right. Happy routing!',
  },
]

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

  // guided tour
  const [tourOpen, setTourOpen] = useState(false)
  useEffect(() => {
    if (!localStorage.getItem(TOUR_SEEN_KEY)) setTourOpen(true)
  }, [])
  function closeTour() {
    setTourOpen(false)
    localStorage.setItem(TOUR_SEEN_KEY, '1')
  }

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
            data-tour="report"
            onClick={() => setReportOpen(true)}
            disabled={!selectedRoute}
            title={selectedRoute ? 'Generate compliance report' : 'Select a route first'}
          >
            📋 Compliance Report
          </button>
          <button
            className="btn ghost-light help-btn"
            onClick={() => setTourOpen(true)}
            title="How to use this app — start the guided tour"
            aria-label="Start guided tour"
          >
            ?
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
          <div className="map-toolbar" data-tour="toolbar">
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
          <div className="panel" data-tour="routes">
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

      {tourOpen && <Tour steps={TOUR_STEPS} onClose={closeTour} />}
    </div>
  )
}
