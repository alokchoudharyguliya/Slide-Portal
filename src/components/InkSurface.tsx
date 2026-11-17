import { useEffect, useRef, useState } from 'react'
import { arrowParts, eraseArea, eraseStroke, newStrokeId, pathFrom, pressureOutline } from '../lib/ink/geometry'
import { LASER_IDLE_MS, emptyLaser, laserOpacity, tickLaser, type LaserSession, type LaserStroke } from '../lib/ink/laser'
import type { Annotation } from '../lib/ink/useAnnotation'
import type { BoardSize, Point, Stroke } from '../lib/ink/types'

export function InkSurface({ annotation }: { annotation: Annotation }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState<BoardSize>({ width: 1, height: 1 })
  const [draft, setDraft] = useState<Stroke | null>(null)
  const [live, setLive] = useState<Stroke[] | null>(null)
  const [cursor, setCursor] = useState<Point | null>(null)
  const drawing = useRef<{ pointerId: number; points: Point[]; base: Stroke[]; laserId?: string } | null>(null)
  const penDown = useRef(false)
  const penAt = useRef(0)
  const contacts = useRef(new Map<number, { x: number; y: number }>())
  const panning = useRef(false)
  const draftRef = useRef<Stroke | null>(null)
  const liveRef = useRef<Stroke[] | null>(null)
  const sessionRef = useRef<LaserSession | null>(null)
  const laserFrame = useRef(0)
  const pumpRef = useRef<(now: number) => void>(() => {})
  const [laser, setLaser] = useState<{ strokes: LaserStroke[]; opacity: number }>({ strokes: [], opacity: 1 })
  const shown = live ?? annotation.strokes
  const erasing = annotation.kind === 'erase-stroke' || annotation.kind === 'erase-area'
  const lasing = annotation.kind === 'laser'
  const ruled = annotation.kind === 'line' || annotation.kind === 'arrow'

  useEffect(() => {
    pumpRef.current = (now: number) => {
      const session = sessionRef.current
      if (!session) {
        laserFrame.current = 0
        setLaser({ strokes: [], opacity: 1 })
        return
      }
      const next = tickLaser(session, now)
      sessionRef.current = next
      const opacity = next ? laserOpacity(next, now) : 1
      if (!next || next !== session || opacity < 1) setLaser({ strokes: next?.strokes ?? [], opacity: next ? opacity : 1 })
      if (next && (next.idleUntil != null || next.fadeStart != null)) {
        laserFrame.current = requestAnimationFrame((time) => pumpRef.current(time))
      } else laserFrame.current = 0
    }
  })

  function armLaser() {
    if (laserFrame.current) return
    laserFrame.current = requestAnimationFrame((now) => pumpRef.current(now))
  }

  useEffect(() => {
    if (lasing) return
    const session = sessionRef.current
    if (!session || session.idleUntil != null || session.fadeStart != null) return
    sessionRef.current = { ...session, idleUntil: performance.now() + LASER_IDLE_MS }
    armLaser()
  }, [lasing])

  useEffect(
    () => () => {
      if (laserFrame.current) cancelAnimationFrame(laserFrame.current)
    },
    [],
  )

  useEffect(() => {
    const element = svgRef.current
    if (!element) return
    const measure = () => {
      const rect = element.getBoundingClientRect()
      setSize({ width: Math.max(rect.width, 1), height: Math.max(rect.height, 1) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [annotation.on, annotation.strokes.length])

  function pointFrom(event: React.PointerEvent<SVGSVGElement>): Point {
    return locate(event.nativeEvent, event.currentTarget.getBoundingClientRect(), undefined)
  }

  function board(): BoardSize {
    const rect = svgRef.current?.getBoundingClientRect()
    return { width: Math.max(rect?.width ?? 1, 1), height: Math.max(rect?.height ?? 1, 1) }
  }

  function samples(from: Point, to: Point) {
    const current = board()
    const distance = Math.hypot((to.x - from.x) * current.width, (to.y - from.y) * current.height)
    const steps = Math.max(1, Math.ceil(distance / 4))
    const points: Point[] = []
    for (let step = 1; step <= steps; step += 1) {
      points.push({
        x: from.x + ((to.x - from.x) * step) / steps,
        y: from.y + ((to.y - from.y) * step) / steps,
      })
    }
    return points
  }

  function applyEraser(strokes: Stroke[], centers: Point[]) {
    return centers.reduce((current, center) => {
      const radius = annotation.width / 2
      const currentSize = board()
      return annotation.kind === 'erase-stroke'
        ? eraseStroke(current, center, radius, currentSize)
        : eraseArea(current, center, radius, currentSize)
    }, strokes)
  }

  function discardGesture() {
    const gesture = drawing.current
    drawing.current = null
    draftRef.current = null
    liveRef.current = null
    setDraft(null)
    setLive(null)
    if (!gesture?.laserId || !sessionRef.current) return
    const strokes = sessionRef.current.strokes.filter((stroke) => stroke.id !== gesture.laserId)
    sessionRef.current = { ...sessionRef.current, strokes }
    setLaser({ strokes, opacity: 1 })
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (!annotation.on || event.button !== 0) return
    const native = event.nativeEvent
    if (native.pointerType === 'pen') {
      penDown.current = true
      penAt.current = performance.now()
      contacts.current.clear()
      panning.current = false
      if (drawing.current && drawing.current.pointerId !== event.pointerId) discardGesture()
    }
    if (palmContact(native)) return
    if (native.pointerType === 'touch' && !penDown.current) {
      contacts.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (contacts.current.size >= 2) {
        panning.current = true
        discardGesture()
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          // The other finger is already captured. Scrolling still follows whichever finger moves.
        }
        return
      }
      if (performance.now() - penAt.current < PEN_TOUCH_GAP_MS) return
    }
    if (penDown.current && native.pointerType === 'touch') return
    if (panning.current) return
    if (drawing.current && drawing.current.pointerId !== event.pointerId) return
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // A pointer that is not active (tests, some pens) still draws.
    }
    const point = pointFrom(event)
    if (lasing) {
      const stroke: LaserStroke = { id: newStrokeId(), color: annotation.color, width: annotation.width, points: [point] }
      const session = sessionRef.current ?? emptyLaser()
      sessionRef.current = { ...session, strokes: [...session.strokes, stroke], idleUntil: null, fadeStart: null, removed: 0 }
      drawing.current = { pointerId: event.pointerId, points: [point], base: annotation.strokes, laserId: stroke.id }
      setCursor(null)
      setLaser({ strokes: sessionRef.current.strokes, opacity: 1 })
      return
    }
    drawing.current = { pointerId: event.pointerId, points: [point], base: annotation.strokes }
    if (annotation.kind === 'pen' || annotation.kind === 'marker' || ruled) {
      const stroke = {
        id: newStrokeId(),
        color: annotation.color,
        opacity: annotation.opacity,
        width: annotation.width,
        marker: annotation.kind === 'marker',
        shape: annotation.kind === 'line' || annotation.kind === 'arrow' ? annotation.kind : undefined,
        points: [point],
      }
      draftRef.current = stroke
      liveRef.current = null
      setDraft(stroke)
      setLive(null)
    } else {
      const erased = applyEraser(annotation.strokes, [point])
      draftRef.current = null
      liveRef.current = erased
      setDraft(null)
      setLive(erased)
      setCursor(point)
    }
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const native = event.nativeEvent
    if (native.pointerType === 'pen') penAt.current = performance.now()
    if (native.pointerType === 'touch' && contacts.current.has(event.pointerId)) {
      const previous = contacts.current.get(event.pointerId)
      if (previous && panning.current) {
        const canvas = event.currentTarget.closest('.wb-canvas')
        if (canvas) {
          canvas.scrollLeft -= event.clientX - previous.x
          canvas.scrollTop -= event.clientY - previous.y
        }
      }
      contacts.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (panning.current) return
    }
    const gesture = drawing.current
    if (gesture?.pointerId === event.pointerId && palmContact(native)) {
      discardGesture()
      return
    }
    if (!gesture || gesture.pointerId !== event.pointerId) {
      if (rejectTouch(native, penDown.current, penAt.current)) return
      if (annotation.on && (erasing || lasing)) setCursor(pointFrom(event))
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const coalesced = event.nativeEvent.getCoalescedEvents?.() ?? []
    const nativePoints = (coalesced.length > 0 ? coalesced : [event.nativeEvent]).map((sample) =>
      locate(sample, rect, gesture.points[gesture.points.length - 1]),
    )
    if (draftRef.current?.shape === 'line' || draftRef.current?.shape === 'arrow') {
      const end = nativePoints[nativePoints.length - 1]
      if (!end) return
      gesture.points = [gesture.points[0], end]
      const next = { ...draftRef.current, points: gesture.points.slice() }
      draftRef.current = next
      setDraft(next)
      return
    }
    const last = gesture.points[gesture.points.length - 1]
    const currentSize = board()
    const nextPoints = nativePoints.filter((point) => {
      const dx = (point.x - last.x) * currentSize.width
      const dy = (point.y - last.y) * currentSize.height
      return Math.hypot(dx, dy) >= 0.6
    })
    if (nextPoints.length === 0) return
    gesture.points.push(...nextPoints)
    if (gesture.laserId && sessionRef.current) {
      const laserId = gesture.laserId
      const points = gesture.points.slice()
      sessionRef.current = {
        ...sessionRef.current,
        idleUntil: null,
        fadeStart: null,
        strokes: sessionRef.current.strokes.map((stroke) => (stroke.id === laserId ? { ...stroke, points } : stroke)),
      }
      setLaser({ strokes: sessionRef.current.strokes, opacity: 1 })
      return
    }
    if (annotation.kind === 'pen' || annotation.kind === 'marker') {
      const next = draftRef.current ? { ...draftRef.current, points: gesture.points.slice() } : null
      draftRef.current = next
      setDraft(next)
      return
    }
    const path = nextPoints.flatMap((point, index) => samples(index === 0 ? last : nextPoints[index - 1], point))
    const erased = applyEraser(liveRef.current ?? gesture.base, path)
    liveRef.current = erased
    setLive(erased)
    setCursor(nextPoints[nextPoints.length - 1])
  }

  function finish(event: React.PointerEvent<SVGSVGElement>) {
    if (event.nativeEvent.pointerType === 'pen') {
      penDown.current = false
      penAt.current = performance.now()
    }
    if (event.nativeEvent.pointerType === 'touch') {
      contacts.current.delete(event.pointerId)
      if (contacts.current.size < 2) panning.current = false
    }
    const gesture = drawing.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    drawing.current = null
    if (gesture.laserId && sessionRef.current) {
      sessionRef.current = { ...sessionRef.current, idleUntil: performance.now() + LASER_IDLE_MS, fadeStart: null }
      setCursor(pointFrom(event))
      armLaser()
      return
    }
    if (annotation.kind === 'pen' || annotation.kind === 'marker' || annotation.kind === 'line' || annotation.kind === 'arrow') {
      let stroke = draftRef.current
      if (stroke && (stroke.shape === 'line' || stroke.shape === 'arrow')) {
        const end = pointFrom(event)
        stroke = { ...stroke, points: [stroke.points[0], end] }
      }
      draftRef.current = null
      setDraft(null)
      if (stroke && keepStroke(stroke, board())) annotation.commit(gesture.base, [...gesture.base, stroke])
      return
    }
    const erased = liveRef.current
    liveRef.current = null
    setLive(null)
    if (erased) annotation.commit(gesture.base, erased)
  }

  const markers = shown.filter((stroke) => stroke.marker)
  const pens = shown.filter((stroke) => !stroke.marker)
  const laserHead = laser.strokes.at(-1)
  const laserTip = laserHead?.points.at(-1)

  return (
    <svg
      ref={svgRef}
      className={`ink-surface ${annotation.on ? 'on' : ''} ${erasing ? 'erasing' : ''} ${lasing ? 'laser' : ''}`}
      role={annotation.on ? 'application' : undefined}
      aria-label={annotation.on ? 'Slide annotation' : undefined}
      onPointerDown={onPointerDown}
      onPointerEnter={(event) => {
        if (rejectTouch(event.nativeEvent, penDown.current, penAt.current)) return
        if (annotation.on && (lasing || erasing)) setCursor(pointFrom(event))
      }}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onPointerLeave={() => {
        if (!drawing.current) setCursor(null)
      }}
    >
      <defs>
        <filter id="ink-laser-blur" x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      {markers.map((stroke) => (
        <StrokeShape key={stroke.id} stroke={stroke} size={size} />
      ))}
      {pens.map((stroke) => (
        <StrokeShape key={stroke.id} stroke={stroke} size={size} />
      ))}
      <g className="ink-laser" opacity={laser.opacity}>
        {laser.strokes.map((stroke) => (
          <LaserMark key={stroke.id} stroke={stroke} size={size} />
        ))}
        {laserTip && laserHead && (
          <LaserDot x={laserTip.x * size.width} y={laserTip.y * size.height} color={laserHead.color} radius={laserHead.width} />
        )}
      </g>
      {annotation.on && lasing && cursor && (
        <LaserDot x={cursor.x * size.width} y={cursor.y * size.height} color={annotation.color} radius={Math.max(annotation.width, 4)} />
      )}
      {draft && <StrokeShape stroke={draft} size={size} />}
      {annotation.on && erasing && cursor && (
        <circle className="ink-cursor" cx={cursor.x * size.width} cy={cursor.y * size.height} r={annotation.width / 2} />
      )}
    </svg>
  )
}

function LaserDot({ x, y, color, radius }: { x: number; y: number; color: string; radius: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={Math.max(radius * 2.4, 10)} fill={color} filter="url(#ink-laser-blur)" opacity="0.9" />
      <circle cx={x} cy={y} r={Math.max(radius * 0.55, 2.2)} fill="#ffffff" />
    </g>
  )
}

function LaserMark({ stroke, size }: { stroke: LaserStroke; size: BoardSize }) {
  const point = stroke.points[0]
  if (!point) return null
  const outer = Math.max(stroke.width * 3, 11)
  const inner = Math.max(stroke.width * 0.8, 2.2)
  if (stroke.points.length === 1) return <LaserDot x={point.x * size.width} y={point.y * size.height} color={stroke.color} radius={stroke.width} />
  const d = pathFrom(stroke.points, size)
  return (
    <g>
      <path d={d} fill="none" stroke={stroke.color} strokeWidth={outer} strokeLinecap="round" strokeLinejoin="round" filter="url(#ink-laser-blur)" strokeOpacity="0.9" />
      <path d={d} fill="none" stroke="#ffffff" strokeWidth={inner} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function StrokeShape({ stroke, size }: { stroke: Stroke; size: BoardSize }) {
  const point = stroke.points[0]
  const end = stroke.points[stroke.points.length - 1]
  if (!point || !end) return null
  if (stroke.shape === 'arrow' && stroke.points.length > 1) {
    const parts = arrowParts(point, end, stroke.width, size)
    return (
      <g opacity={stroke.opacity}>
        <path d={parts.shaft} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" />
        <path d={parts.head} fill={stroke.color} />
      </g>
    )
  }
  const outline = pressureOutline(stroke.points, stroke.width, size)
  if (outline) return <path d={outline} fill={stroke.color} opacity={stroke.opacity} />
  if (stroke.points.length === 1) {
    return (
      <circle
        cx={point.x * size.width}
        cy={point.y * size.height}
        r={pointRadius(stroke, point)}
        fill={stroke.color}
        opacity={stroke.opacity}
      />
    )
  }
  return (
    <path
      d={pathFrom(stroke.points, size)}
      fill="none"
      stroke={stroke.color}
      strokeWidth={stroke.width}
      strokeOpacity={stroke.opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

function pointRadius(stroke: Stroke, point: Point) {
  const pressure = point.pressure
  const width = pressure == null ? stroke.width : stroke.width * (0.18 + 0.82 * pressure)
  return Math.max(width / 2, 0.8)
}

function locate(sample: PointerEvent, rect: DOMRect, previous: Point | undefined): Point {
  const point: Point = {
    x: clamp((sample.clientX - rect.left) / (rect.width || 1)),
    y: clamp((sample.clientY - rect.top) / (rect.height || 1)),
  }
  const pressure = readPressure(sample, previous?.pressure)
  if (pressure != null) point.pressure = pressure
  return point
}

function readPressure(sample: PointerEvent, previous: number | undefined) {
  if (sample.pointerType === 'mouse') return undefined
  let pressure: number | undefined
  if (sample.pressure > 0) pressure = clamp(sample.pressure)
  else if (sample.pointerType === 'touch' && sample.width > 1) pressure = clamp((sample.width - 4) / 24)
  else if (sample.pointerType === 'pen') pressure = 0.08
  if (pressure == null) return undefined
  return previous == null ? pressure : previous * 0.35 + pressure * 0.65
}

function keepStroke(stroke: Stroke, size: BoardSize) {
  const start = stroke.points[0]
  const end = stroke.points[stroke.points.length - 1]
  if (!start || !end) return false
  if (stroke.shape !== 'line' && stroke.shape !== 'arrow') return true
  const dx = (end.x - start.x) * size.width
  const dy = (end.y - start.y) * size.height
  return Math.hypot(dx, dy) >= 3
}

const PALM_CONTACT_PX = 40
const PEN_TOUCH_GAP_MS = 1000

function palmContact(sample: PointerEvent) {
  return sample.pointerType === 'touch' && Math.max(sample.width, sample.height) >= PALM_CONTACT_PX
}

function rejectTouch(sample: PointerEvent, penIsDown: boolean, penSeenAt: number) {
  if (sample.pointerType !== 'touch') return false
  if (penIsDown || performance.now() - penSeenAt < PEN_TOUCH_GAP_MS) return true
  return palmContact(sample)
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}
