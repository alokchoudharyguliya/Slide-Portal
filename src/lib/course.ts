export const courseFormat = 'slide-portal' as const

export type SlideNode = {
  id: string
  parentId: string | null
  title: string
  content: string
}

export type CourseFile = {
  format: typeof courseFormat
  version: 1
  id: string
  title: string
  description?: string
  nodes: SlideNode[]
  assets?: Record<string, string>
}

const storageKey = 'slide-portal:courses:v1'

export function loadDrafts(): CourseFile[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const course = courseFrom(item)
      return course ? [course] : []
    })
  } catch {
    return []
  }
}

export function saveDrafts(courses: CourseFile[]) {
  localStorage.setItem(storageKey, JSON.stringify(courses))
}

export function parseCourse(raw: string): CourseFile | null {
  try {
    return courseFrom(JSON.parse(raw))
  } catch {
    return null
  }
}

function courseFrom(value: unknown): CourseFile | null {
  if (!value || typeof value !== 'object') return null
  const course = value as Partial<CourseFile>
  if (course.format !== courseFormat || course.version !== 1) return null
  if (typeof course.id !== 'string' || !course.id.trim()) return null
  if (typeof course.title !== 'string' || !course.title.trim()) return null
  if (!Array.isArray(course.nodes)) return null

  const seen = new Set<string>()
  const nodes: SlideNode[] = []
  for (const node of course.nodes) {
    if (!node || typeof node !== 'object') return null
    const item = node as Partial<SlideNode>
    if (typeof item.id !== 'string' || !item.id.trim()) return null
    if (seen.has(item.id)) return null
    if (typeof item.title !== 'string') return null
    if (typeof item.content !== 'string') return null
    if (item.parentId !== null && typeof item.parentId !== 'string') return null
    seen.add(item.id)
    nodes.push({
      id: item.id,
      parentId: item.parentId ?? null,
      title: item.title,
      content: item.content,
    })
  }

  return {
    format: courseFormat,
    version: 1,
    id: course.id,
    title: course.title,
    description: typeof course.description === 'string' ? course.description : undefined,
    nodes,
    assets: assetsFrom(course.assets),
  }
}

function assetsFrom(value: unknown) {
  if (!value || typeof value !== 'object') return undefined
  const assets: Record<string, string> = {}
  for (const [id, item] of Object.entries(value)) {
    if (typeof item === 'string' && item.startsWith('data:image/')) assets[id] = item
  }
  return Object.keys(assets).length > 0 ? assets : undefined
}

export function downloadCourse(course: CourseFile) {
  const blob = new Blob([JSON.stringify(course, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${course.id}.json`
  link.click()
  URL.revokeObjectURL(url)
}
