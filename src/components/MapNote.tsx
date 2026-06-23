import { useState } from 'react'

interface Props {
  onClose: () => void
  onArm: (text: string) => void
}

/**
 * Modal to compose a map note. After the text is entered, the app enters
 * "note placement" mode and the next map click drops the note. The rendered
 * note bubbles on the map live in MapView.
 */
export default function MapNote({ onClose, onArm }: Props) {
  const [text, setText] = useState('')

  function submit() {
    const t = text.trim()
    if (!t) return
    onArm(t)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontSize: 22 }}>📌</span>
          <div>
            <h2>Add map note</h2>
            <div className="muted">Place a custom annotation on the planning map</div>
          </div>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <label className="field-label">Note text</label>
          <textarea
            className="text-input"
            rows={3}
            autoFocus
            placeholder="e.g. Check trench depth near harbour crossing"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
            }}
          />
          <p className="muted" style={{ marginTop: 10 }}>
            After saving, click anywhere on the map to place this note. (⌘/Ctrl + Enter to continue)
          </p>
          <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', marginTop: 14 }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={submit} disabled={!text.trim()}>
              Place on map →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
