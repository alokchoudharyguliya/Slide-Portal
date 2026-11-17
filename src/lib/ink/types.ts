export type ToolKind = 'pen' | 'marker' | 'line' | 'arrow' | 'laser' | 'erase-stroke' | 'erase-area'

export type StrokeShapeKind = 'line' | 'arrow'

export type Point = {
  x: number
  y: number
  pressure?: number
}

export type Stroke = {
  id: string
  color: string
  opacity: number
  width: number
  marker: boolean
  shape?: StrokeShapeKind
  points: Point[]
}

export type BoardSize = {
  width: number
  height: number
}
