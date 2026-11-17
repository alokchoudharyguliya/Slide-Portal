import type { BoardSize, Point, Stroke } from './types'

export function newStrokeId() {
  return `ink-${crypto.randomUUID()}`
}

export function toPixel(point: Point, size: BoardSize) {
  return { x: point.x * size.width, y: point.y * size.height }
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const abx = bx - ax
  const aby = by - ay
  const lengthSquared = abx * abx + aby * aby
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSquared))
  const dx = ax + abx * t - px
  const dy = ay + aby * t - py
  return Math.hypot(dx, dy)
}

function hits(stroke: Stroke, center: Point, radius: number, size: BoardSize) {
  const reach = radius + stroke.width / 2
  const pixels = stroke.points.map((point) => toPixel(point, size))
  const cx = center.x * size.width
  const cy = center.y * size.height
  for (let index = 0; index < pixels.length; index += 1) {
    const point = pixels[index]
    if (Math.hypot(point.x - cx, point.y - cy) <= reach) return true
    if (index > 0) {
      const previous = pixels[index - 1]
      if (distanceToSegment(cx, cy, previous.x, previous.y, point.x, point.y) <= reach) return true
    }
  }
  return false
}

export function eraseStroke(strokes: Stroke[], center: Point, radius: number, size: BoardSize) {
  const next = strokes.filter((stroke) => !hits(stroke, center, radius, size))
  return next.length === strokes.length ? strokes : next
}

export function eraseArea(strokes: Stroke[], center: Point, radius: number, size: BoardSize) {
  let changed = false
  const next = strokes.flatMap((stroke) => {
    const parts = splitStroke(stroke, center, radius, size)
    if (parts.length === 1 && parts[0] === stroke) return [stroke]
    changed = true
    return parts
  })
  return changed ? next : strokes
}

function splitStroke(stroke: Stroke, center: Point, radius: number, size: BoardSize): Stroke[] {
  const reach = radius + stroke.width / 2
  const cx = center.x * size.width
  const cy = center.y * size.height
  const inside = (point: Point) => {
    const pixel = toPixel(point, size)
    return Math.hypot(pixel.x - cx, pixel.y - cy) <= reach
  }
  const runs: Point[][] = []
  let run: Point[] = []
  const flush = () => {
    if (run.length > 1 || (run.length === 1 && stroke.points.length === 1)) runs.push(run)
    run = []
  }

  for (const point of stroke.points) {
    if (inside(point)) {
      flush()
      continue
    }
    const previous = run[run.length - 1]
    if (previous) {
      const a = toPixel(previous, size)
      const b = toPixel(point, size)
      if (distanceToSegment(cx, cy, a.x, a.y, b.x, b.y) <= reach) flush()
    }
    run.push(point)
  }
  flush()

  if (runs.length === 1 && runs[0].length === stroke.points.length) return [stroke]
  return runs.map((points) => ({ ...stroke, id: newStrokeId(), points }))
}

export function pressureOutline(points: Point[], width: number, size: BoardSize) {
  if (points.length < 2 || !pressureVaries(points)) return ''
  const pixels = points.map((point) => {
    const pixel = toPixel(point, size)
    const pressure = point.pressure ?? 0.5
    return { x: pixel.x, y: pixel.y, radius: Math.max((width * (0.18 + 0.82 * pressure)) / 2, 0.6) }
  })
  const left: { x: number; y: number }[] = []
  const right: { x: number; y: number }[] = []
  for (let index = 0; index < pixels.length; index += 1) {
    const previous = pixels[Math.max(0, index - 1)]
    const next = pixels[Math.min(pixels.length - 1, index + 1)]
    const length = Math.hypot(next.x - previous.x, next.y - previous.y) || 1
    const normalX = -(next.y - previous.y) / length
    const normalY = (next.x - previous.x) / length
    const radius = pixels[index].radius
    left.push({ x: pixels[index].x + normalX * radius, y: pixels[index].y + normalY * radius })
    right.push({ x: pixels[index].x - normalX * radius, y: pixels[index].y - normalY * radius })
  }
  const command = (point: { x: number; y: number }) => `${point.x} ${point.y}`
  let path = `M ${command(left[0])}`
  for (const point of left.slice(1)) path += ` L ${command(point)}`
  for (const point of right.reverse()) path += ` L ${command(point)}`
  return `${path} Z`
}

function pressureVaries(points: Point[]) {
  const values = points.map((point) => point.pressure).filter((pressure): pressure is number => pressure != null)
  if (values.length < 2) return false
  const first = values[0]
  return values.some((pressure) => Math.abs(pressure - first) > 0.04)
}

export function arrowParts(start: Point, end: Point, width: number, size: BoardSize) {
  const ax = start.x * size.width
  const ay = start.y * size.height
  const bx = end.x * size.width
  const by = end.y * size.height
  const dx = bx - ax
  const dy = by - ay
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length
  const uy = dy / length
  const head = Math.min(Math.max(width * 4.5, 14), length * 0.72)
  const wing = head * 0.48
  const baseX = bx - ux * head
  const baseY = by - uy * head
  return {
    shaft: `M ${ax} ${ay} L ${baseX} ${baseY}`,
    head: `M ${baseX + -uy * wing} ${baseY + ux * wing} L ${bx} ${by} L ${baseX - -uy * wing} ${baseY - ux * wing} Z`,
  }
}

export function pathFrom(points: Point[], size: BoardSize) {
  if (points.length === 0) return ''
  const command = (point: Point) => `${point.x * size.width} ${point.y * size.height}`
  if (points.length === 1) return ''
  let path = `M ${command(points[0])}`
  if (points.length === 2) return `${path} L ${command(points[1])}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const midX = ((current.x + next.x) / 2) * size.width
    const midY = ((current.y + next.y) / 2) * size.height
    path += ` Q ${command(current)} ${midX} ${midY}`
  }
  path += ` L ${command(points[points.length - 1])}`
  return path
}
