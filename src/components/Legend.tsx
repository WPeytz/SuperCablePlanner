/**
 * Static legend explaining every map element. Mirrors the visual encoding used
 * in MapView so a presentation audience can read the map unaided.
 */
export default function Legend() {
  return (
    <div className="panel" style={{ borderBottom: 'none' }}>
      <h3 className="panel-title">Legend</h3>
      <div className="legend-grid">
        <LegendLine color="#f59e0b" dash="2 7" label="Existing HV cable" />
        <LegendLine color="#0ea5e9" label="Proposed route" />
        <LegendLine color="#0b1b33" dash="9 5" label="Custom drawn route" />
        <LegendLine color="#3b82f6" label="Water main" />
        <LegendLine color="#eab308" dash="7 5" label="Gas pipeline" />
        <LegendLine color="#7c3aed" dash="2 6" label="Metro line" />
        <LegendLine color="#64748b" dash="10 4" label="Legacy cable" />

        <LegendSwatch color="#7c3aed" icon="🖥️" label="Heavy electricity user" />
        <LegendSwatch color="#ef4444" icon="🏥" border label="Critical infrastructure" />
        <LegendSwatch color="#f97316" icon="🚧" label="Roadwork / upgrade" />
        <LegendSwatch color="#dc2626" icon="⚠️" border label="Conflict warning" />

        <LegendZone stroke="#dc2626" fill="rgba(220,38,38,0.12)" label="Protected · military" />
        <LegendZone stroke="#10b981" fill="rgba(16,185,129,0.14)" label="Protected · nature" />
        <LegendZone stroke="#a855f7" fill="rgba(168,85,247,0.13)" label="Protected · heritage" />
      </div>
    </div>
  )
}

function LegendLine({ color, dash, label }: { color: string; dash?: string; label: string }) {
  return (
    <div className="legend-item">
      <svg className="legend-line" height="10" viewBox="0 0 22 10" style={{ overflow: 'visible' }}>
        <line x1="0" y1="5" x2="22" y2="5" stroke={color} strokeWidth="3" strokeDasharray={dash} strokeLinecap="round" />
      </svg>
      <span>{label}</span>
    </div>
  )
}

function LegendSwatch({ color, icon, label, border }: { color: string; icon: string; label: string; border?: boolean }) {
  return (
    <div className="legend-item">
      <div
        className="legend-swatch"
        style={{ background: border ? '#fff' : color, border: border ? `2px solid ${color}` : 'none' }}
      >
        {icon}
      </div>
      <span>{label}</span>
    </div>
  )
}

function LegendZone({ stroke, fill, label }: { stroke: string; fill: string; label: string }) {
  return (
    <div className="legend-item">
      <div className="legend-swatch" style={{ background: fill, border: `1.5px dashed ${stroke}` }} />
      <span>{label}</span>
    </div>
  )
}
