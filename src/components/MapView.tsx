import { useRef, useState } from 'react'
import type {
  Conflict,
  CriticalInfra,
  HeavyUser,
  LayerKey,
  MapNoteData,
  Point,
  ProposedRoute,
  ProtectedZone,
  Utility,
} from '../types'
import {
  CRITICAL_INFRA,
  EXISTING_CABLES,
  HEAVY_USERS,
  PROTECTED_ZONES,
  ROADWORKS,
  UTILITIES,
} from '../data/mockData'

const VIEW = 1000 // SVG coordinate space (square)

// ---------------------------------------------------------------------------
// Procedural city basemap geometry. Generated once at module load with a fixed
// seed so the "big city" texture (blocks, streets, water, parks) is stable
// across renders and looks like a dense urban fabric without hand-placing
// hundreds of buildings.
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Block {
  x: number
  y: number
  w: number
  h: number
  fill: string
}

/** East shoreline of the Øresund sound at a given y (city is to the left). */
const waterLeft = (y: number) => 762 - 0.2 * y

/** Ellipses where no buildings are drawn (lakes & parks). */
const NO_BUILD = [
  { cx: 225, cy: 372, rx: 66, ry: 32 }, // Lake 1 (Søerne)
  { cx: 298, cy: 462, rx: 78, ry: 28 }, // Lake 2
  { cx: 362, cy: 552, rx: 58, ry: 24 }, // Lake 3
  { cx: 168, cy: 692, rx: 82, ry: 72 }, // South-west park
  { cx: 206, cy: 176, rx: 72, ry: 56 }, // North park / cemetery
  { cx: 520, cy: 712, rx: 92, ry: 82 }, // Common (overlaps nature zone — reads green)
]

const BLOCK_FILLS = ['#dbe3ec', '#e4e9f1', '#d4dde9', '#e9edf3', '#dde5ee']

const CITY_BLOCKS: Block[] = (() => {
  const rng = mulberry32(20260623)
  const blocks: Block[] = []
  const step = 32
  for (let gx = 26; gx < 944; gx += step) {
    for (let gy = 26; gy < 974; gy += step) {
      const cx = gx + step / 2
      const cy = gy + step / 2
      if (cx > waterLeft(cy) - 12) continue // in the sound
      if (NO_BUILD.some((z) => ((cx - z.cx) / z.rx) ** 2 + ((cy - z.cy) / z.ry) ** 2 < 1)) continue
      if (rng() < 0.1) continue // occasional plaza / open block
      const padX = 4 + rng() * 6
      const padY = 4 + rng() * 6
      const w = step - padX
      const h = step - padY
      blocks.push({
        x: gx + (step - w) / 2 + (rng() - 0.5) * 3,
        y: gy + (step - h) / 2 + (rng() - 0.5) * 3,
        w,
        h,
        fill: BLOCK_FILLS[(rng() * BLOCK_FILLS.length) | 0],
      })
    }
  }
  return blocks
})()

const DISTRICTS: { name: string; x: number; y: number }[] = [
  { name: 'NØRREBRO', x: 205, y: 300 },
  { name: 'ØSTERBRO', x: 560, y: 175 },
  { name: 'INDRE BY', x: 430, y: 455 },
  { name: 'VESTERBRO', x: 245, y: 615 },
  { name: 'SYDHAVN', x: 300, y: 792 },
  { name: 'NORDHAVN', x: 735, y: 158 },
  { name: 'AMAGER', x: 650, y: 868 },
]

const UTILITY_STYLE: Record<Utility['kind'], { color: string; dash: string; label: string }> = {
  water: { color: '#3b82f6', dash: '1 0', label: 'Water main' },
  gas: { color: '#eab308', dash: '7 5', label: 'Gas pipeline' },
  metro: { color: '#7c3aed', dash: '2 6', label: 'Metro line' },
  normalCable: { color: '#64748b', dash: '10 4', label: 'Legacy cable' },
}

const PROTECTED_FILL: Record<ProtectedZone['kind'], string> = {
  military: 'rgba(220, 38, 38, 0.12)',
  nature: 'rgba(16, 185, 129, 0.14)',
  heritage: 'rgba(168, 85, 247, 0.13)',
}
const PROTECTED_STROKE: Record<ProtectedZone['kind'], string> = {
  military: '#dc2626',
  nature: '#10b981',
  heritage: '#a855f7',
}

const CONFLICT_ICON: Record<Conflict['kind'], string> = {
  protectedZone: '🛡️',
  roadwork: '🚧',
  criticalProximity: '🏥',
  segmentRange: '📏',
  utilityConflict: '🧰',
}

function toPath(points: Point[], close = false): string {
  if (points.length === 0) return ''
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  return close ? `${d} Z` : d
}

interface TooltipState {
  x: number
  y: number
  title: string
  sub?: string
}

interface Props {
  visibleLayers: Record<LayerKey, boolean>
  routes: ProposedRoute[]
  conflicts: Conflict[]
  selectedRouteId: string | null
  onSelectRoute: (id: string) => void
  drawMode: boolean
  customRoute: Point[]
  onAddCustomPoint: (p: Point) => void
  noteMode: boolean
  notes: MapNoteData[]
  onAddNotePoint: (p: Point) => void
  onRemoveNote: (id: string) => void
}

export default function MapView({
  visibleLayers,
  routes,
  conflicts,
  selectedRouteId,
  onSelectRoute,
  drawMode,
  customRoute,
  onAddCustomPoint,
  noteMode,
  notes,
  onAddNotePoint,
  onRemoveNote,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  function svgPoint(e: React.MouseEvent): Point {
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    // Map is rendered with preserveAspectRatio slice-free (meet) into a square
    // viewBox stretched across the container — convert client → view coords.
    const x = ((e.clientX - rect.left) / rect.width) * VIEW
    const y = ((e.clientY - rect.top) / rect.height) * VIEW
    return { x: Math.round(x), y: Math.round(y) }
  }

  function handleClick(e: React.MouseEvent) {
    if (drawMode) onAddCustomPoint(svgPoint(e))
    else if (noteMode) onAddNotePoint(svgPoint(e))
  }

  function showTip(e: React.MouseEvent, title: string, sub?: string) {
    const rect = svgRef.current!.getBoundingClientRect()
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title, sub })
  }

  return (
    <div
      className={`map-wrap ${drawMode ? 'map-drawing' : ''} ${noteMode ? 'map-note-adding' : ''}`}
    >
      <svg
        ref={svgRef}
        className="map-svg"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="none"
        onClick={handleClick}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#dde5ef" strokeWidth="0.5" />
          </pattern>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0b1b33" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* base city map */}
        <rect width={VIEW} height={VIEW} fill="#eaeef4" />
        <rect width={VIEW} height={VIEW} fill="url(#grid)" />
        <CityBase />

        {/* Protected zones */}
        {visibleLayers.protectedZones &&
          PROTECTED_ZONES.map((z) => (
            <g key={z.id}>
              <path
                d={toPath(z.polygon, true)}
                fill={PROTECTED_FILL[z.kind]}
                stroke={PROTECTED_STROKE[z.kind]}
                strokeWidth={2}
                strokeDasharray="6 4"
                onMouseMove={(e) => showTip(e, z.name, `Protected · ${z.kind}`)}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'help' }}
              />
            </g>
          ))}

        {/* Existing utilities */}
        {visibleLayers.utilities &&
          UTILITIES.map((u) => {
            const st = UTILITY_STYLE[u.kind]
            return (
              <path
                key={u.id}
                d={toPath(u.path)}
                fill="none"
                stroke={st.color}
                strokeWidth={3}
                strokeDasharray={st.dash}
                strokeLinecap="round"
                opacity={0.85}
                onMouseMove={(e) => showTip(e, u.name, st.label)}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'help' }}
              />
            )
          })}

        {/* Existing cable system */}
        {visibleLayers.existingCables &&
          EXISTING_CABLES.map((c) => (
            <g key={c.id}>
              <path d={toPath(c.path)} fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.5} />
              <path
                d={toPath(c.path)}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="2 7"
                onMouseMove={(e) => showTip(e, c.name, `Existing · ${c.voltage}`)}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'help' }}
              />
            </g>
          ))}

        {/* Roadworks */}
        {visibleLayers.roadworks &&
          ROADWORKS.map((r) => (
            <g
              key={r.id}
              onMouseMove={(e) => showTip(e, r.name, `${r.status} · ${r.window}`)}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'help' }}
            >
              <circle
                cx={r.position.x}
                cy={r.position.y}
                r={r.radius}
                fill="rgba(249, 115, 22, 0.12)"
                stroke="#f97316"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <RoadworkMarker p={r.position} planned={r.status === 'planned'} />
            </g>
          ))}

        {/* Proposed routes (non-selected first, selected on top) */}
        {visibleLayers.proposedRoutes &&
          [...routes]
            .sort((a) => (a.id === selectedRouteId ? 1 : -1))
            .map((route) => {
              const selected = route.id === selectedRouteId
              return (
                <g key={route.id} onClick={(e) => { e.stopPropagation(); onSelectRoute(route.id) }} style={{ cursor: 'pointer' }}>
                  <path d={toPath(route.path)} fill="none" stroke="#fff" strokeWidth={selected ? 11 : 8} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
                  <path
                    d={toPath(route.path)}
                    fill="none"
                    stroke={route.color}
                    strokeWidth={selected ? 6 : 4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={selected ? 1 : 0.62}
                    onMouseMove={(e) => showTip(e, `Route ${route.code} — ${route.name}`, route.tagline)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  {route.path.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={selected ? 4 : 3} fill="#fff" stroke={route.color} strokeWidth={2} opacity={selected ? 1 : 0.62} />
                  ))}
                  {/* endpoints */}
                  <EndpointMarker p={route.path[0]} color={route.color} label="A" />
                  <EndpointMarker p={route.path[route.path.length - 1]} color={route.color} label="B" />
                </g>
              )
            })}

        {/* Heavy users */}
        {visibleLayers.heavyUsers &&
          HEAVY_USERS.map((h) => (
            <HeavyUserMarker key={h.id} user={h} onTip={showTip} offTip={() => setTooltip(null)} />
          ))}

        {/* Critical infrastructure */}
        {visibleLayers.criticalInfra &&
          CRITICAL_INFRA.map((c) => (
            <CriticalMarker key={c.id} infra={c} onTip={showTip} offTip={() => setTooltip(null)} />
          ))}

        {/* Conflicts (only for selected route, plus always-on if layer enabled) */}
        {visibleLayers.conflicts &&
          conflicts.map((cf) => (
            <g
              key={cf.id}
              onMouseMove={(e) => showTip(e, cf.title, cf.detail)}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'help' }}
            >
              <circle cx={cf.position.x} cy={cf.position.y} r={15} fill="#fff" stroke="#dc2626" strokeWidth={2} filter="url(#soft)" />
              <text x={cf.position.x} y={cf.position.y + 5} textAnchor="middle" fontSize="15">
                {CONFLICT_ICON[cf.kind]}
              </text>
              <circle cx={cf.position.x} cy={cf.position.y} r={15} fill="none" stroke="#dc2626" strokeWidth={2} opacity={0.5}>
                <animate attributeName="r" values="15;22;15" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          ))}

        {/* Custom drawn route */}
        {customRoute.length > 0 && (
          <g>
            <path d={toPath(customRoute)} fill="none" stroke="#0b1b33" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="9 5" />
            {customRoute.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={5} fill="#fff" stroke="#0b1b33" strokeWidth={2.5} />
            ))}
            {customRoute.length > 0 && (
              <text x={customRoute[0].x + 9} y={customRoute[0].y - 9} fontSize="13" fontWeight="700" fill="#0b1b33">
                Custom
              </text>
            )}
          </g>
        )}
      </svg>

      {/* HTML overlays (notes + tooltip) positioned via percentage */}
      {notes.map((n) => (
        <div
          key={n.id}
          className="map-note"
          style={{ left: `${(n.position.x / VIEW) * 100}%`, top: `${(n.position.y / VIEW) * 100}%` }}
        >
          <button className="note-close" onClick={() => onRemoveNote(n.id)} aria-label="Remove note">
            ×
          </button>
          📌 {n.text}
        </div>
      ))}

      {tooltip && (
        <div className="map-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.title}
          {tooltip.sub && <div className="tt-sub">{tooltip.sub}</div>}
        </div>
      )}

      <Compass />

      <div className="map-badge">
        <span>🧭</span> Copenhagen · Stylized planning view
        {drawMode && <span style={{ color: '#7dd3fc' }}>· Draw mode: click to add points</span>}
        {noteMode && <span style={{ color: '#fcd34d' }}>· Note mode: click to place</span>}
      </div>
    </div>
  )
}

// --- detailed city basemap --------------------------------------------------
function CityBase() {
  return (
    <g>
      {/* ---- water: the Øresund sound on the east edge ---- */}
      <path
        d="M 762 0 C 726 180, 700 320, 668 460 C 644 566, 604 770, 560 1000 L 1000 1000 L 1000 0 Z"
        fill="#bcd8f0"
        stroke="#7fb1de"
        strokeWidth={2}
      />
      {/* inner-harbour canal cutting toward the city */}
      <path
        d="M 668 460 C 612 470, 560 520, 548 600 C 540 660, 556 740, 560 1000"
        fill="none"
        stroke="#9cc4e6"
        strokeWidth={16}
        strokeLinecap="round"
        opacity={0.8}
      />
      <text x={880} y={520} fontSize={20} fill="#5f93c4" fontStyle="italic" letterSpacing="3" opacity={0.7}>
        ØRESUND
      </text>

      {/* ---- parks (drawn before blocks so block gaps read as paths) ---- */}
      {NO_BUILD.slice(3).map((p, i) => (
        <g key={i}>
          <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill="#c2e0bf" stroke="#9ccb97" strokeWidth={1.5} />
          {Array.from({ length: 7 }).map((_, t) => {
            const ang = (t / 7) * Math.PI * 2
            return (
              <circle
                key={t}
                cx={p.cx + Math.cos(ang) * p.rx * 0.55}
                cy={p.cy + Math.sin(ang) * p.ry * 0.55}
                r={4}
                fill="#86c07f"
              />
            )
          })}
        </g>
      ))}

      {/* ---- city blocks ---- */}
      <g stroke="#c2cedd" strokeWidth={0.6}>
        {CITY_BLOCKS.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={1.5} fill={b.fill} />
        ))}
      </g>

      {/* ---- lakes (Søerne) over the blocks ---- */}
      {NO_BUILD.slice(0, 3).map((l, i) => (
        <ellipse key={i} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill="#bcd8f0" stroke="#7fb1de" strokeWidth={1.5} />
      ))}

      {/* ---- street network (white, with hierarchy) ---- */}
      <g fill="none" stroke="#ffffff" strokeLinecap="round">
        {/* ring boulevard */}
        <path
          d="M 250 250 Q 470 180 620 300 Q 705 470 560 645 Q 380 745 235 600 Q 145 425 250 250 Z"
          strokeWidth={9}
          opacity={0.95}
        />
        {/* major radial arterials */}
        <g strokeWidth={7} opacity={0.92}>
          <path d="M 30 248 L 745 226" />
          <path d="M 50 545 L 690 525" />
          <path d="M 120 835 L 670 705" />
          <path d="M 205 50 L 372 962" />
          <path d="M 520 36 L 470 982" />
          <path d="M 712 120 L 360 905" />
          <path d="M 60 120 L 690 690" />
        </g>
        {/* secondary streets */}
        <g strokeWidth={3} opacity={0.7}>
          <path d="M 150 160 L 470 360" />
          <path d="M 600 200 L 470 540" />
          <path d="M 120 420 L 560 460" />
          <path d="M 300 700 L 640 620" />
          <path d="M 440 120 L 720 320" />
        </g>
      </g>
      {/* ring-road centre line */}
      <path
        d="M 250 250 Q 470 180 620 300 Q 705 470 560 645 Q 380 745 235 600 Q 145 425 250 250 Z"
        fill="none"
        stroke="#f1b24a"
        strokeWidth={1.4}
        strokeDasharray="6 7"
        opacity={0.7}
      />

      {/* ---- bridges across the sound / canal ---- */}
      <g stroke="#e7d7a8" strokeWidth={6} strokeLinecap="round" opacity={0.95}>
        <path d="M 632 470 L 690 462" fill="none" />
        <path d="M 542 690 L 600 700" fill="none" />
      </g>

      {/* ---- district labels ---- */}
      <g fill="#7c8da3" opacity={0.62} fontWeight={700} fontSize={14}>
        {DISTRICTS.map((d) => (
          <text key={d.name} x={d.x} y={d.y} textAnchor="middle" letterSpacing="2">
            {d.name}
          </text>
        ))}
      </g>
    </g>
  )
}

function HeavyUserMarker({
  user,
  onTip,
  offTip,
}: {
  user: HeavyUser
  onTip: (e: React.MouseEvent, t: string, s?: string) => void
  offTip: () => void
}) {
  const label = user.kind === 'dataCenter' ? '🖥️' : user.kind === 'industrial' ? '🏭' : '🚉'
  return (
    <g
      onMouseMove={(e) => onTip(e, user.name, `${user.demandMW} MW demand`)}
      onMouseLeave={offTip}
      style={{ cursor: 'help' }}
    >
      <rect x={user.position.x - 14} y={user.position.y - 14} width={28} height={28} rx={7} fill="#7c3aed" filter="url(#soft)" />
      <text x={user.position.x} y={user.position.y + 6} textAnchor="middle" fontSize="15">
        {label}
      </text>
    </g>
  )
}

function CriticalMarker({
  infra,
  onTip,
  offTip,
}: {
  infra: CriticalInfra
  onTip: (e: React.MouseEvent, t: string, s?: string) => void
  offTip: () => void
}) {
  const label = infra.kind === 'hospital' ? '🏥' : infra.kind === 'emergency' ? '🚨' : '📡'
  return (
    <g
      onMouseMove={(e) => onTip(e, infra.name, `${infra.priority === 'high' ? 'High' : 'Medium'} priority · ${infra.kind}`)}
      onMouseLeave={offTip}
      style={{ cursor: 'help' }}
    >
      <circle cx={infra.position.x} cy={infra.position.y} r={15} fill="#fff" stroke="#ef4444" strokeWidth={infra.priority === 'high' ? 3 : 2} filter="url(#soft)" />
      <text x={infra.position.x} y={infra.position.y + 5} textAnchor="middle" fontSize="14">
        {label}
      </text>
    </g>
  )
}

function RoadworkMarker({ p, planned }: { p: Point; planned: boolean }) {
  return (
    <g>
      <rect x={p.x - 12} y={p.y - 12} width={24} height={24} rx={6} fill={planned ? '#fdba74' : '#f97316'} filter="url(#soft)" />
      <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize="13">
        🚧
      </text>
    </g>
  )
}

function EndpointMarker({ p, color, label }: { p: Point; color: string; label: string }) {
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={9} fill={color} stroke="#fff" strokeWidth={2.5} filter="url(#soft)" />
      <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">
        {label}
      </text>
    </g>
  )
}

function Compass() {
  return (
    <svg className="map-compass" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="20" fill="rgba(255,255,255,0.85)" stroke="#9aabc0" />
      <polygon points="22,6 27,24 22,20 17,24" fill="#dc2626" />
      <polygon points="22,38 17,20 22,24 27,20" fill="#64748b" />
      <text x="22" y="15" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0b1b33">
        N
      </text>
    </svg>
  )
}
