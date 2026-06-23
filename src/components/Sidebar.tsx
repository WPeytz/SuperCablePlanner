import type { LayerKey } from '../types'
import { LAYERS } from '../data/mockData'
import FilterPanel from './FilterPanel'
import Legend from './Legend'
import type { ConsiderationKey } from '../types'

interface Props {
  visibleLayers: Record<LayerKey, boolean>
  onToggleLayer: (key: LayerKey) => void
  activeConsiderations: Record<ConsiderationKey, boolean>
  onToggleConsideration: (key: ConsiderationKey) => void
}

export default function Sidebar({
  visibleLayers,
  onToggleLayer,
  activeConsiderations,
  onToggleConsideration,
}: Props) {
  return (
    <aside className="col col-left">
      <div className="panel">
        <h3 className="panel-title">
          Map layers
          <span className="count">{Object.values(visibleLayers).filter(Boolean).length}/{LAYERS.length}</span>
        </h3>
        {LAYERS.map((layer) => {
          const on = visibleLayers[layer.key]
          return (
            <div key={layer.key} className="toggle-row" onClick={() => onToggleLayer(layer.key)}>
              <div className="toggle-icon" style={{ background: `${layer.color}22`, color: layer.color }}>
                {layer.icon}
              </div>
              <div className="toggle-text">
                <div className="t">{layer.label}</div>
                <div className="d">{layer.description}</div>
              </div>
              <div className={`switch ${on ? 'on' : ''}`} />
            </div>
          )
        })}
      </div>

      <FilterPanel active={activeConsiderations} onToggle={onToggleConsideration} />

      <Legend />
    </aside>
  )
}
