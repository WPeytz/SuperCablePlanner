# SuperCablePlanner

**Decision support for routing superconducting cables in future power-hungry cities.**

A polished frontend **prototype** for planning superconducting power-cable routes in
urban areas, built for an engineering innovation presentation. It uses a stylized 2D
planning map of Copenhagen and structured **mock data** — no backend or real GIS
integration required yet.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## What it does

- **Stylized planning map** of Copenhagen (SVG) with water, roads, districts and a compass.
- **Toggleable layers** (left sidebar): existing cable system, heavy electricity users,
  critical infrastructure, protected zones, planned roadworks, existing utilities,
  proposed routes, and conflict warnings.
- **Three proposed routes** — A (shortest), B (most sustainable), C (critical-priority) —
  each with estimated cost, install time, public acceptance, technical feasibility,
  sustainability, reasoning and risks.
- **Conflict warnings** rendered as pulsing markers on the map (protected-zone crossings,
  roadwork overlaps, critical-infrastructure proximity, segment-range, utility conflicts).
- **Route comparison table** that respects the active considerations and highlights the
  selected route + best value per row.
- **Compliance report generator** — a modal report for the selected route with constraint
  checks, conflicts, protected zones avoided/not avoided, public acceptance and a
  recommendation.
- **Draw your own route** mode (click points on the map) + clear.
- **Map notes** — compose a note and place it on the map.
- **Considerations filter** to include/exclude factors used in comparison & compliance.
- **Legend** explaining every map element.

## Structure

```
src/
  App.tsx                      # app shell + state orchestration
  types.ts                     # domain types (GIS/grid-shaped)
  data/mockData.ts             # all mock data — swap for real feeds later
  components/
    Sidebar.tsx                # layer toggles + filters + legend
    FilterPanel.tsx            # consideration include/exclude
    Legend.tsx                 # map element key
    MapView.tsx                # the stylized SVG planning map
    RouteCard.tsx              # per-route detail card
    RouteComparison.tsx        # comparison table
    ComplianceReport.tsx       # generated report modal
    MapNote.tsx                # add-note modal
```

## Replacing the mock data with real data

All coordinates use an abstract `0–1000` map space (see `MapView`). The arrays in
`src/data/mockData.ts` (cables, utilities, heavy users, critical infrastructure,
protected-zone polygons, roadworks, routes, conflicts) are typed in `src/types.ts` and
designed to be replaced by real GeoJSON / grid-asset feeds with a projection step.

> All figures are fictional and for demonstration only.
