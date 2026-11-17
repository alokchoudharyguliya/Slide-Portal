import type { ToolKind } from './types'

export type Swatch = {
  id: string
  label: string
  value: string
}

export const penColors: Swatch[] = [
  { id: 'chalk', label: 'Chalk', value: '#f4f4f4' },
  { id: 'amber', label: 'Amber', value: '#ffd60a' },
  { id: 'coral', label: 'Coral', value: '#ff6b4a' },
  { id: 'sky', label: 'Sky', value: '#4da3ff' },
  { id: 'mint', label: 'Mint', value: '#3dd68c' },
  { id: 'violet', label: 'Violet', value: '#c792ea' },
]

export const markerColors: Swatch[] = [
  { id: 'mark-yellow', label: 'Yellow marker', value: '#ffe14a' },
  { id: 'mark-aqua', label: 'Aqua marker', value: '#5dffe0' },
  { id: 'mark-pink', label: 'Pink marker', value: '#ff7ad9' },
]

export const laserColors: Swatch[] = [
  { id: 'laser-red', label: 'Red laser', value: '#ff2b2b' },
  { id: 'laser-green', label: 'Green laser', value: '#3dd68c' },
  { id: 'laser-blue', label: 'Blue laser', value: '#4da3ff' },
]

export const toolOrder: { kind: ToolKind; label: string }[] = [
  { kind: 'pen', label: 'Pen' },
  { kind: 'marker', label: 'Marker' },
  { kind: 'line', label: 'Line' },
  { kind: 'arrow', label: 'Arrow' },
  { kind: 'laser', label: 'Laser' },
  { kind: 'erase-stroke', label: 'Stroke eraser' },
  { kind: 'erase-area', label: 'Area eraser' },
]

export function opacityFor(kind: ToolKind) {
  return kind === 'marker' ? 0.45 : 1
}
