// ---------------------------------------------------------------------------
// SuperCablePlanner — domain types
//
// These types intentionally mirror the kind of structure a real GIS / grid
// dataset would provide, so the mock data in data/mockData.ts could later be
// swapped for live feeds (GeoJSON features, grid asset registries, etc.)
// without changing the component layer.
// ---------------------------------------------------------------------------

/** A point in the stylized map's coordinate space (0–1000 on each axis). */
export interface Point {
  x: number
  y: number
}

/** All toggleable map layers. The key doubles as the layer's id. */
export type LayerKey =
  | 'existingCables'
  | 'heavyUsers'
  | 'criticalInfra'
  | 'protectedZones'
  | 'roadworks'
  | 'utilities'
  | 'proposedRoutes'
  | 'conflicts'

export interface LayerDef {
  key: LayerKey
  label: string
  description: string
  color: string
  icon: string
}

/** Considerations the planner can include / exclude when weighing routes. */
export type ConsiderationKey =
  | 'cost'
  | 'installationTime'
  | 'publicAcceptance'
  | 'sustainability'
  | 'criticalPriority'
  | 'protectedAvoidance'
  | 'roadworkCoordination'
  | 'cableProximity'

export interface ConsiderationDef {
  key: ConsiderationKey
  label: string
  description: string
}

export type UtilityKind = 'water' | 'gas' | 'metro' | 'normalCable'

export interface ExistingCable {
  id: string
  name: string
  voltage: string
  path: Point[]
}

export interface Utility {
  id: string
  kind: UtilityKind
  name: string
  path: Point[]
}

export type HeavyUserKind = 'dataCenter' | 'industrial' | 'transitHub'

export interface HeavyUser {
  id: string
  name: string
  kind: HeavyUserKind
  demandMW: number
  position: Point
}

export type CriticalKind = 'hospital' | 'emergency' | 'telecom'

export interface CriticalInfra {
  id: string
  name: string
  kind: CriticalKind
  priority: 'high' | 'medium'
  position: Point
}

export type ProtectedKind = 'military' | 'nature' | 'heritage'

export interface ProtectedZone {
  id: string
  name: string
  kind: ProtectedKind
  /** Polygon outline in map coordinates. */
  polygon: Point[]
}

export interface Roadwork {
  id: string
  name: string
  status: 'active' | 'planned'
  window: string
  position: Point
  radius: number
}

export type ConflictKind =
  | 'protectedZone'
  | 'roadwork'
  | 'criticalProximity'
  | 'segmentRange'
  | 'utilityConflict'

export type Severity = 'high' | 'medium' | 'low'

export interface Conflict {
  id: string
  routeId: string
  kind: ConflictKind
  severity: Severity
  title: string
  detail: string
  position: Point
}

export interface RouteScores {
  cost: number // million DKK
  installMonths: number
  publicAcceptance: number // 0–100
  feasibility: number // 0–100
  sustainability: number // 0–100
}

export interface ProposedRoute {
  id: string
  code: string // "A", "B", "C"
  name: string
  tagline: string
  color: string
  path: Point[]
  scores: RouteScores
  reasoning: string
  risks: string[]
}

export interface MapNoteData {
  id: string
  text: string
  position: Point
}
