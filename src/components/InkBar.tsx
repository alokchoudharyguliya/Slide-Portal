import { ArrowUpRight, Eraser, Highlighter, PenLine, Redo2, Trash2, Undo2 } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { laserColors, markerColors, penColors, toolOrder } from '../lib/ink/palette'
import type { Annotation } from '../lib/ink/useAnnotation'
import type { ToolKind } from '../lib/ink/types'

const icons: Record<ToolKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  pen: PenLine,
  marker: Highlighter,
  line: LineIcon,
  arrow: ArrowUpRight,
  laser: LaserIcon,
  'erase-stroke': Eraser,
  'erase-area': Eraser,
}

export function InkBar({ annotation }: { annotation: Annotation }) {
  const swatches = annotation.kind === 'marker' ? markerColors : annotation.kind === 'laser' ? laserColors : penColors
  const drawing = annotation.kind === 'pen' || annotation.kind === 'marker' || annotation.kind === 'line' || annotation.kind === 'arrow' || annotation.kind === 'laser'

  return (
    <div className="ink-bar" role="toolbar" aria-label="Annotation tools">
      {toolOrder.map((tool) => {
        const Icon = icons[tool.kind]
        return (
          <button
            key={tool.kind}
            type="button"
            className={annotation.kind === tool.kind ? 'active' : ''}
            aria-label={tool.label}
            aria-pressed={annotation.kind === tool.kind}
            title={tool.label}
            onClick={() => annotation.setKind(tool.kind)}
          >
            <Icon />
            {tool.kind === 'erase-area' ? <span>Area</span> : null}
            {tool.kind === 'erase-stroke' ? <span>Stroke</span> : null}
          </button>
        )
      })}
      <div className="ink-swatches" aria-hidden={!drawing}>
        {swatches.map((swatch) => (
          <button
            key={swatch.id}
            type="button"
            className={`ink-swatch ${annotation.color === swatch.value ? 'active' : ''}`}
            style={{ background: swatch.value }}
            aria-label={swatch.label}
            aria-pressed={annotation.color === swatch.value}
            disabled={!drawing}
            onClick={() => annotation.setColor(swatch.value)}
          />
        ))}
        <label className="ink-custom">
          <span className="sr-only">Custom ink color</span>
          <input
            type="color"
            value={toColorInput(annotation.color)}
            aria-label="Custom ink color"
            disabled={!drawing}
            onChange={(event) => {
              if (annotation.kind === 'erase-stroke' || annotation.kind === 'erase-area') annotation.setKind('pen')
              annotation.setColor(event.target.value)
            }}
          />
        </label>
      </div>
      <label className="ink-width">
        <span>
          {annotation.kind === 'pen' ? 'Pen' : annotation.kind === 'marker' ? 'Marker' : annotation.kind === 'line' ? 'Line' : annotation.kind === 'arrow' ? 'Arrow' : annotation.kind === 'laser' ? 'Laser' : 'Eraser'}
        </span>
        <input
          type="range"
          min={annotation.kind === 'marker' ? 8 : annotation.kind === 'laser' ? 2 : 1}
          max={annotation.kind === 'pen' || annotation.kind === 'line' || annotation.kind === 'arrow' ? 16 : annotation.kind === 'laser' ? 12 : 48}
          step={0.5}
          value={annotation.width}
          aria-label="Tool width"
          onChange={(event) => annotation.setWidth(Number(event.target.value))}
        />
      </label>
      <button type="button" aria-label="Undo stroke" title="Undo" disabled={!annotation.canUndo} onClick={annotation.undo}>
        <Undo2 />
      </button>
      <button type="button" aria-label="Redo stroke" title="Redo" disabled={!annotation.canRedo} onClick={annotation.redo}>
        <Redo2 />
      </button>
      <button type="button" aria-label="Clear annotations" title="Clear annotations" onClick={annotation.clear}>
        <Trash2 />
      </button>
    </div>
  )
}

function toColorInput(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#f4f4f4'
}

function LineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M5 19 19 5" />
    </svg>
  )
}

function LaserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20l6.2-6.2" />
      <path d="M9.2 14.8 12 12" />
      <circle cx="16.2" cy="7.6" r="3.1" />
      <circle cx="16.2" cy="7.6" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  )
}
