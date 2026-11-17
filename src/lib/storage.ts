const storageKey = 'slide-portal:v1'

type Progress = {
  last?: { courseId: string; slideId: string }
  seen: string[]
}

function read(): Progress {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return { seen: [] }
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      last: parsed.last,
      seen: Array.isArray(parsed.seen) ? parsed.seen : [],
    }
  } catch {
    return { seen: [] }
  }
}

function write(progress: Progress) {
  localStorage.setItem(storageKey, JSON.stringify(progress))
}

export function loadProgress() {
  return read()
}

export function rememberLocation(courseId: string, slideId: string) {
  const progress = read()
  const token = `${courseId}:${slideId}`
  const seen = progress.seen.includes(token) ? progress.seen : [...progress.seen, token]
  write({ last: { courseId, slideId }, seen })
  return seen
}

export function resetProgress() {
  const progress = read()
  write({ last: progress.last, seen: [] })
}
