import type { Point, Stroke } from './types'

const storageKey = 'slide-portal:ink:v1'

type Store = Record<string, Stroke[]>

function read(): Store {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Store
  } catch {
    return {}
  }
}

function isPoint(value: unknown): value is Point {
  if (!value || typeof value !== 'object') return false
  const point = value as Partial<Point>
  return typeof point.x === 'number' && typeof point.y === 'number'
}

function isStroke(value: unknown): value is Stroke {
  if (!value || typeof value !== 'object') return false
  const stroke = value as Partial<Stroke>
  return (
    typeof stroke.id === 'string' &&
    typeof stroke.color === 'string' &&
    typeof stroke.opacity === 'number' &&
    typeof stroke.width === 'number' &&
    typeof stroke.marker === 'boolean' &&
    Array.isArray(stroke.points) &&
    stroke.points.every(isPoint)
  )
}

export function inkKey(courseId: string, slideId: string) {
  return `${courseId}:${slideId}`
}

export function loadInk(key: string): Stroke[] {
  const stored = read()[key]
  if (!Array.isArray(stored)) return []
  return stored.filter(isStroke)
}

export function saveInk(key: string, strokes: Stroke[]) {
  const stored = read()
  if (strokes.length === 0) delete stored[key]
  else stored[key] = strokes
  localStorage.setItem(storageKey, JSON.stringify(stored))
}
