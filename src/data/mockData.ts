// ---------------------------------------------------------------------------
// SuperCablePlanner — mock dataset
//
// Everything here is fictional but structured to resemble a real planning
// dataset for Copenhagen. Coordinates live in a 0–1000 abstract map space
// (see MapView). Replace these arrays with GIS/grid feeds to go live.
// ---------------------------------------------------------------------------

import type {
  ConsiderationDef,
  Conflict,
  CriticalInfra,
  ExistingCable,
  HeavyUser,
  LayerDef,
  ProposedRoute,
  ProtectedZone,
  Roadwork,
  Utility,
} from '../types'

export const LAYERS: LayerDef[] = [
  {
    key: 'existingCables',
    label: 'Existing cable system',
    description: 'In-service high-voltage grid cables',
    color: '#f59e0b',
    icon: '⚡',
  },
  {
    key: 'heavyUsers',
    label: 'Heavy electricity users',
    description: 'Data centers & industrial demand clusters',
    color: '#a855f7',
    icon: '🏭',
  },
  {
    key: 'criticalInfra',
    label: 'Critical infrastructure',
    description: 'Hospitals & emergency services (prioritized)',
    color: '#ef4444',
    icon: '🏥',
  },
  {
    key: 'protectedZones',
    label: 'Protected zones',
    description: 'Military, nature & heritage areas (avoid)',
    color: '#10b981',
    icon: '🛡️',
  },
  {
    key: 'roadworks',
    label: 'Planned roadworks / upgrades',
    description: 'Active and scheduled civil works',
    color: '#f97316',
    icon: '🚧',
  },
  {
    key: 'utilities',
    label: 'Existing utilities',
    description: 'Water, gas, metro & legacy cables',
    color: '#64748b',
    icon: '🧰',
  },
  {
    key: 'proposedRoutes',
    label: 'Proposed routes',
    description: 'Candidate superconducting cable corridors',
    color: '#0ea5e9',
    icon: '🛣️',
  },
  {
    key: 'conflicts',
    label: 'Conflict warnings',
    description: 'Detected routing conflicts & hazards',
    color: '#dc2626',
    icon: '⚠️',
  },
]

export const CONSIDERATIONS: ConsiderationDef[] = [
  { key: 'cost', label: 'Cost', description: 'Capital & civil works expenditure' },
  { key: 'installationTime', label: 'Installation time', description: 'Time to energize the corridor' },
  { key: 'publicAcceptance', label: 'Public acceptance', description: 'Estimated community support' },
  { key: 'sustainability', label: 'Sustainability', description: 'Environmental & disruption footprint' },
  { key: 'criticalPriority', label: 'Critical infrastructure priority', description: 'Service to hospitals & emergency loads' },
  { key: 'protectedAvoidance', label: 'Protected zone avoidance', description: 'Distance kept from protected areas' },
  { key: 'roadworkCoordination', label: 'Planned roadwork coordination', description: 'Synergy with scheduled civil works' },
  { key: 'cableProximity', label: 'Existing cable proximity', description: 'Reuse of existing grid corridors' },
]

// --- Existing high-voltage cable system ------------------------------------
export const EXISTING_CABLES: ExistingCable[] = [
  {
    id: 'cab-1',
    name: 'Amager–City 132kV link',
    voltage: '132 kV',
    path: [
      { x: 520, y: 760 },
      { x: 470, y: 620 },
      { x: 430, y: 500 },
      { x: 420, y: 380 },
    ],
  },
  {
    id: 'cab-2',
    name: 'Northern ring 132kV',
    voltage: '132 kV',
    path: [
      { x: 200, y: 250 },
      { x: 360, y: 220 },
      { x: 540, y: 240 },
      { x: 700, y: 300 },
    ],
  },
]

// --- Existing underground utilities ----------------------------------------
export const UTILITIES: Utility[] = [
  {
    id: 'util-water-1',
    kind: 'water',
    name: 'Main water transmission',
    path: [
      { x: 150, y: 540 },
      { x: 360, y: 540 },
      { x: 560, y: 560 },
      { x: 760, y: 540 },
    ],
  },
  {
    id: 'util-gas-1',
    kind: 'gas',
    name: 'Regional gas pipeline',
    path: [
      { x: 300, y: 820 },
      { x: 360, y: 680 },
      { x: 420, y: 540 },
      { x: 480, y: 380 },
    ],
  },
  {
    id: 'util-metro-1',
    kind: 'metro',
    name: 'Metro M3 Cityringen',
    path: [
      { x: 380, y: 460 },
      { x: 460, y: 420 },
      { x: 540, y: 440 },
      { x: 600, y: 510 },
      { x: 560, y: 600 },
      { x: 460, y: 600 },
      { x: 380, y: 540 },
      { x: 380, y: 460 },
    ],
  },
  {
    id: 'util-cable-1',
    kind: 'normalCable',
    name: 'Legacy 50kV distribution',
    path: [
      { x: 700, y: 700 },
      { x: 620, y: 600 },
      { x: 560, y: 480 },
      { x: 540, y: 360 },
    ],
  },
]

// --- Heavy electricity users -----------------------------------------------
export const HEAVY_USERS: HeavyUser[] = [
  { id: 'hu-1', name: 'Ørestad Data Center', kind: 'dataCenter', demandMW: 120, position: { x: 560, y: 800 } },
  { id: 'hu-2', name: 'Nordhavn Hyperscale', kind: 'dataCenter', demandMW: 180, position: { x: 720, y: 250 } },
  { id: 'hu-3', name: 'Sydhavn Industrial Park', kind: 'industrial', demandMW: 75, position: { x: 320, y: 720 } },
  { id: 'hu-4', name: 'Central Transit Hub', kind: 'transitHub', demandMW: 45, position: { x: 450, y: 470 } },
]

// --- Critical infrastructure -----------------------------------------------
export const CRITICAL_INFRA: CriticalInfra[] = [
  { id: 'ci-1', name: 'Rigshospitalet', kind: 'hospital', priority: 'high', position: { x: 430, y: 360 } },
  { id: 'ci-2', name: 'Bispebjerg Hospital', kind: 'hospital', priority: 'high', position: { x: 300, y: 230 } },
  { id: 'ci-3', name: 'Amager Hospital', kind: 'hospital', priority: 'medium', position: { x: 600, y: 700 } },
  { id: 'ci-4', name: 'Central Emergency Dispatch', kind: 'emergency', priority: 'high', position: { x: 470, y: 520 } },
  { id: 'ci-5', name: 'TDC Telecom Core', kind: 'telecom', priority: 'medium', position: { x: 540, y: 300 } },
]

// --- Protected zones --------------------------------------------------------
export const PROTECTED_ZONES: ProtectedZone[] = [
  {
    id: 'pz-1',
    name: 'Kastellet Heritage Site',
    kind: 'heritage',
    polygon: [
      { x: 600, y: 340 },
      { x: 680, y: 330 },
      { x: 700, y: 400 },
      { x: 640, y: 430 },
      { x: 590, y: 400 },
    ],
  },
  {
    id: 'pz-2',
    name: 'Amager Fælled Nature Reserve',
    kind: 'nature',
    polygon: [
      { x: 470, y: 660 },
      { x: 560, y: 650 },
      { x: 600, y: 740 },
      { x: 520, y: 800 },
      { x: 440, y: 760 },
    ],
  },
  {
    id: 'pz-3',
    name: 'Holmen Military Area',
    kind: 'military',
    polygon: [
      { x: 640, y: 520 },
      { x: 730, y: 510 },
      { x: 760, y: 590 },
      { x: 690, y: 630 },
      { x: 620, y: 590 },
    ],
  },
]

// --- Planned roadworks / utility upgrades ----------------------------------
export const ROADWORKS: Roadwork[] = [
  { id: 'rw-1', name: 'Bridge St. resurfacing', status: 'active', window: 'Q2–Q3 2026', position: { x: 470, y: 590 }, radius: 38 },
  { id: 'rw-2', name: 'Harbour tunnel utility upgrade', status: 'planned', window: 'Q1 2027', position: { x: 640, y: 460 }, radius: 44 },
  { id: 'rw-3', name: 'Northern ring district heating', status: 'planned', window: 'Q4 2026', position: { x: 360, y: 300 }, radius: 36 },
]

// --- Proposed superconducting cable routes ---------------------------------
// All three connect the Sydhavn / city load center area to the Nordhavn
// hyperscale demand cluster, but take different corridors.
export const PROPOSED_ROUTES: ProposedRoute[] = [
  {
    id: 'route-a',
    code: 'A',
    name: 'Direct Harbour Corridor',
    tagline: 'Shortest route',
    color: '#0ea5e9',
    path: [
      { x: 320, y: 720 },
      { x: 430, y: 600 },
      { x: 520, y: 500 },
      { x: 620, y: 420 },
      { x: 720, y: 250 },
    ],
    scores: { cost: 86, installMonths: 14, publicAcceptance: 58, feasibility: 82, sustainability: 54 },
    reasoning:
      'Follows the most direct alignment between the Sydhavn load center and the Nordhavn hyperscale cluster, minimizing cable length and conductor cost. Reuses parts of the existing 132 kV corridor to simplify permitting.',
    risks: [
      'Clips the Holmen military protected zone near the harbour crossing.',
      'Crosses the active Bridge St. roadworks window.',
      'Tight parallel run with the legacy 50 kV distribution cable.',
    ],
  },
  {
    id: 'route-b',
    code: 'B',
    name: 'Green Western Bypass',
    tagline: 'Most sustainable / lowest disruption',
    color: '#22c55e',
    path: [
      { x: 320, y: 720 },
      { x: 250, y: 560 },
      { x: 260, y: 400 },
      { x: 360, y: 280 },
      { x: 520, y: 230 },
      { x: 720, y: 250 },
    ],
    scores: { cost: 104, installMonths: 19, publicAcceptance: 81, feasibility: 74, sustainability: 88 },
    reasoning:
      'Swings west to fully avoid protected zones and the harbour, routing along existing road and utility corridors to minimize ground disturbance and community impact. Coordinates with the Northern ring district heating works to share trenching.',
    risks: [
      'Longest alignment — highest material cost and installation time.',
      'Passes close to Bispebjerg Hospital and must maintain EMF clearance.',
      'One segment exceeds the recommended 2.5 km superconducting span.',
    ],
  },
  {
    id: 'route-c',
    code: 'C',
    name: 'Critical-Load Spine',
    tagline: 'Highest reliability / critical priority',
    color: '#f43f5e',
    path: [
      { x: 320, y: 720 },
      { x: 440, y: 560 },
      { x: 460, y: 440 },
      { x: 470, y: 360 },
      { x: 540, y: 300 },
      { x: 700, y: 290 },
    ],
    scores: { cost: 97, installMonths: 17, publicAcceptance: 69, feasibility: 79, sustainability: 63 },
    reasoning:
      'Deliberately threads past Rigshospitalet and the central emergency dispatch to provide a high-reliability feed to priority loads, with redundant tie-in points. Balances directness against critical-infrastructure resilience.',
    risks: [
      'Runs near the Metro M3 alignment — induced-current studies required.',
      'Passes within clearance limits of two high-priority hospitals.',
      'Higher cost than the direct route due to redundancy hardware.',
    ],
  },
]

// --- Detected conflicts (per route) ----------------------------------------
export const CONFLICTS: Conflict[] = [
  // Route A
  {
    id: 'cf-a1',
    routeId: 'route-a',
    kind: 'protectedZone',
    severity: 'high',
    title: 'Crosses protected zone',
    detail: 'Alignment clips the Holmen Military Area near the harbour crossing.',
    position: { x: 660, y: 540 },
  },
  {
    id: 'cf-a2',
    routeId: 'route-a',
    kind: 'roadwork',
    severity: 'medium',
    title: 'Overlaps future roadwork',
    detail: 'Intersects the active Bridge St. resurfacing window (Q2–Q3 2026).',
    position: { x: 470, y: 590 },
  },
  {
    id: 'cf-a3',
    routeId: 'route-a',
    kind: 'utilityConflict',
    severity: 'medium',
    title: 'Conflicts with existing utility',
    detail: 'Runs parallel and close to the legacy 50 kV distribution cable.',
    position: { x: 560, y: 470 },
  },
  // Route B
  {
    id: 'cf-b1',
    routeId: 'route-b',
    kind: 'criticalProximity',
    severity: 'medium',
    title: 'Close to critical infrastructure',
    detail: 'Passes near Bispebjerg Hospital — EMF clearance must be verified.',
    position: { x: 300, y: 250 },
  },
  {
    id: 'cf-b2',
    routeId: 'route-b',
    kind: 'segmentRange',
    severity: 'low',
    title: 'Exceeds recommended segment range',
    detail: 'Western span is ~2.7 km, above the 2.5 km cooling-section guideline.',
    position: { x: 255, y: 470 },
  },
  // Route C
  {
    id: 'cf-c1',
    routeId: 'route-c',
    kind: 'utilityConflict',
    severity: 'high',
    title: 'Conflicts with metro line',
    detail: 'Runs alongside the Metro M3 Cityringen — induced-current study required.',
    position: { x: 460, y: 440 },
  },
  {
    id: 'cf-c2',
    routeId: 'route-c',
    kind: 'criticalProximity',
    severity: 'medium',
    title: 'Close to critical infrastructure',
    detail: 'Within clearance limits of Rigshospitalet (high priority).',
    position: { x: 440, y: 365 },
  },
]
