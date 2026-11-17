import type { Point } from './types'

export const LASER_IDLE_MS = 1000
export const LASER_FADE_MS = 800

export type LaserStroke = {
  id: string
  color: string
  width: number
  points: Point[]
}

export type LaserSession = {
  strokes: LaserStroke[]
  idleUntil: number | null
  fadeStart: number | null
  totalAtFade: number
  removed: number
}

export function emptyLaser(): LaserSession {
  return { strokes: [], idleUntil: null, fadeStart: null, totalAtFade: 0, removed: 0 }
}

export function countPoints(strokes: LaserStroke[]) {
  return strokes.reduce((total, stroke) => total + stroke.points.length, 0)
}

export function laserOpacity(session: LaserSession, now: number) {
  if (session.fadeStart == null) return 1
  const progress = Math.min(1, (now - session.fadeStart) / LASER_FADE_MS)
  return 1 - progress * progress
}

export function tickLaser(session: LaserSession, now: number): LaserSession | null {
  if (session.fadeStart == null) {
    if (session.idleUntil == null || now < session.idleUntil) return session
    const totalAtFade = countPoints(session.strokes)
    if (totalAtFade === 0) return null
    return { ...session, idleUntil: null, fadeStart: now, totalAtFade, removed: 0 }
  }

  const progress = Math.min(1, (now - session.fadeStart) / LASER_FADE_MS)
  const eased = progress * progress
  const target = progress >= 1 ? session.totalAtFade : Math.floor(eased * session.totalAtFade)
  const delta = target - session.removed
  if (delta <= 0) return session
  const strokes = dropTail(session.strokes, delta)
  if (countPoints(strokes) === 0) return null
  return { ...session, strokes, removed: target }
}

function dropTail(strokes: LaserStroke[], count: number) {
  let remaining = count
  const next: LaserStroke[] = []
  for (const stroke of strokes) {
    if (remaining <= 0) {
      next.push(stroke)
      continue
    }
    if (remaining >= stroke.points.length) {
      remaining -= stroke.points.length
      continue
    }
    next.push({ ...stroke, points: stroke.points.slice(remaining) })
    remaining = 0
  }
  return next
}
