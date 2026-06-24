// ---------------------------------------------------------------------------
// SuperCablePlanner — custom route scoring
//
// Turns a hand-drawn corridor (an array of Points) into a synthetic
// ProposedRoute so it can be compared side-by-side with the canned candidates.
// Scores and conflicts are derived heuristically from the route geometry and
// the surrounding mock dataset — they are clearly *estimates*, in the same
// spirit as the rest of this prototype.
// ---------------------------------------------------------------------------

import type { Conflict, Point, ProposedRoute } from '../types'
import {
  CRITICAL_INFRA,
  PROTECTED_ZONES,
  ROADWORKS,
  UTILITIES,
} from './mockData'

export const CUSTOM_ROUTE_ID = 'route-custom'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

function pathLength(pts: Point[]): number {
  let total = 0
  for (let i = 1; i < pts.length; i++) total += dist(pts[i - 1], pts[i])
  return total
}

/** Distance from point p to segment a–b. */
function pointSegDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return dist(p, a)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = clamp(t, 0, 1)
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy })
}

function minDistToPath(p: Point, path: Point[]): number {
  let min = Infinity
  for (let i = 1; i < path.length; i++) {
    min = Math.min(min, pointSegDist(p, path[i - 1], path[i]))
  }
  return min
}

/** Ray-casting point-in-polygon test. */
function pointInPolygon(p: Point, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x
    const yi = poly[i].y
    const xj = poly[j].x
    const yj = poly[j].y
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/** Sample points along the path roughly every `step` units (incl. vertices). */
function densify(pts: Point[], step = 14): Point[] {
  const out: Point[] = []
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const segLen = dist(a, b)
    const n = Math.max(1, Math.round(segLen / step))
    for (let k = 0; k < n; k++) {
      const t = k / n
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

const CRITICAL_CLEARANCE = 42 // units within which we flag a proximity conflict
const UTILITY_CLEARANCE = 16 // units within which we flag a parallel-run conflict
const SEGMENT_LIMIT = 230 // single-span limit (≈ cooling-section guideline)

/** Derive the conflicts a drawn corridor would trigger against the dataset. */
export function computeCustomConflicts(path: Point[]): Conflict[] {
  if (path.length < 2) return []
  const samples = densify(path)
  const conflicts: Conflict[] = []

  // Protected zones — crossing one is a high-severity conflict.
  for (const z of PROTECTED_ZONES) {
    const hit = samples.find((s) => pointInPolygon(s, z.polygon))
    if (hit) {
      conflicts.push({
        id: `cf-custom-pz-${z.id}`,
        routeId: CUSTOM_ROUTE_ID,
        kind: 'protectedZone',
        severity: 'high',
        title: 'Crosses protected zone',
        detail: `Alignment enters ${z.name} (${z.kind}).`,
        position: hit,
      })
    }
  }

  // Roadworks — passing through the works radius.
  for (const rw of ROADWORKS) {
    const hit = samples.find((s) => dist(s, rw.position) <= rw.radius)
    if (hit) {
      conflicts.push({
        id: `cf-custom-rw-${rw.id}`,
        routeId: CUSTOM_ROUTE_ID,
        kind: 'roadwork',
        severity: rw.status === 'active' ? 'medium' : 'low',
        title: 'Overlaps roadwork',
        detail: `Intersects ${rw.name} (${rw.status}, ${rw.window}).`,
        position: rw.position,
      })
    }
  }

  // Critical infrastructure proximity.
  for (const ci of CRITICAL_INFRA) {
    const hit = samples.find((s) => dist(s, ci.position) <= CRITICAL_CLEARANCE)
    if (hit) {
      conflicts.push({
        id: `cf-custom-ci-${ci.id}`,
        routeId: CUSTOM_ROUTE_ID,
        kind: 'criticalProximity',
        severity: ci.priority === 'high' ? 'medium' : 'low',
        title: 'Close to critical infrastructure',
        detail: `Passes near ${ci.name} — EMF clearance must be verified.`,
        position: ci.position,
      })
    }
  }

  // Parallel run with an existing utility.
  for (const u of UTILITIES) {
    const hit = samples.find((s) => minDistToPath(s, u.path) <= UTILITY_CLEARANCE)
    if (hit) {
      conflicts.push({
        id: `cf-custom-util-${u.id}`,
        routeId: CUSTOM_ROUTE_ID,
        kind: 'utilityConflict',
        severity: 'medium',
        title: 'Conflicts with existing utility',
        detail: `Runs close to ${u.name}.`,
        position: hit,
      })
    }
  }

  // Over-long single span.
  for (let i = 1; i < path.length; i++) {
    if (dist(path[i - 1], path[i]) > SEGMENT_LIMIT) {
      const mid = { x: (path[i - 1].x + path[i].x) / 2, y: (path[i - 1].y + path[i].y) / 2 }
      conflicts.push({
        id: `cf-custom-seg-${i}`,
        routeId: CUSTOM_ROUTE_ID,
        kind: 'segmentRange',
        severity: 'low',
        title: 'Exceeds recommended segment range',
        detail: 'A single span is above the cooling-section guideline — add a tie-in point.',
        position: mid,
      })
      break // one is enough to make the point
    }
  }

  return conflicts
}

/**
 * Build a synthetic ProposedRoute from a hand-drawn corridor, with estimated
 * scores derived from its length and detected conflicts. Returns null until at
 * least two points have been placed.
 */
export function buildCustomRoute(path: Point[]): {
  route: ProposedRoute
  conflicts: Conflict[]
} | null {
  if (path.length < 2) return null

  const conflicts = computeCustomConflicts(path)
  const len = pathLength(path)

  const protectedHits = conflicts.filter((c) => c.kind === 'protectedZone').length
  const roadworkHits = conflicts.filter((c) => c.kind === 'roadwork').length
  const criticalHits = conflicts.filter((c) => c.kind === 'criticalProximity').length
  const utilityHits = conflicts.filter((c) => c.kind === 'utilityConflict').length
  const segmentHits = conflicts.filter((c) => c.kind === 'segmentRange').length

  // Length-driven estimates calibrated against the canned routes.
  const cost = Math.round(len * 0.135)
  const installMonths = Math.max(8, Math.round(len / 44))

  const publicAcceptance = clamp(
    84 - protectedHits * 14 - criticalHits * 8 - roadworkHits * 5,
    25,
    95,
  )
  const sustainability = clamp(
    Math.round(96 - len * 0.05 - protectedHits * 16 - utilityHits * 4),
    20,
    95,
  )
  const feasibility = clamp(
    88 - utilityHits * 6 - segmentHits * 6 - protectedHits * 8 - conflicts.length * 2,
    25,
    95,
  )

  const route: ProposedRoute = {
    id: CUSTOM_ROUTE_ID,
    code: '✎',
    name: 'Custom Drawn Route',
    tagline: 'Your hand-drawn corridor (estimated)',
    color: '#0b1b33',
    path,
    scores: { cost, installMonths, publicAcceptance, feasibility, sustainability },
    reasoning:
      'A corridor you sketched on the map. Scores and conflicts are estimated from the route geometry and the surrounding dataset, so you can weigh your own alignment against the proposed candidates.',
    risks: conflicts.length
      ? conflicts.map((c) => c.detail)
      : ['No major conflicts detected against the current dataset.'],
  }

  return { route, conflicts }
}
