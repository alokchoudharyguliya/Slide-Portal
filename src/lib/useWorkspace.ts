import { useEffect, useMemo, useState } from 'react'
import { library } from '../content/library'
import { courseFormat, loadDrafts, saveDrafts, type CourseFile, type SlideNode } from './course'
import { loadProgress, rememberLocation } from './storage'
import { buildTree, findPath, firstSlide, flattenSlides } from './tree'

export type Panel = 'explorer' | 'search'

type Tab = {
  courseId: string
  id: string
}

function parseHash(hash: string) {
  const cleaned = hash.replace(/^#\/?/, '')
  if (!cleaned) return {}
  const [courseId, id] = cleaned.split('/').map((part) => decodeURIComponent(part))
  return { courseId, id }
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function useWorkspace() {
  const [drafts, setDrafts] = useState<CourseFile[]>(() => loadDrafts())
  const [hash, setHash] = useState(() => window.location.hash)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [panel, setPanel] = useState<Panel>('explorer')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [presentation, setPresentation] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [creatingCourse, setCreatingCourse] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [pendingOpen, setPendingOpen] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    try {
      saveDrafts(drafts)
    } catch {
      setImportError('This browser ran out of space for the course draft. Export the course, or remove a pasted image.')
    }
  }, [drafts])

  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const courses = useMemo(() => {
    const overrides = new Map(drafts.map((course) => [course.id, course]))
    const shipped = library.map((course) => overrides.get(course.id) ?? course)
    const extra = drafts.filter((course) => !library.some((item) => item.id === course.id))
    return [...shipped, ...extra]
  }, [drafts])

  const indexes = useMemo(
    () =>
      courses.map((course) => {
        const tree = buildTree(course.nodes)
        return { course, tree, flat: flattenSlides(tree) }
      }),
    [courses],
  )

  const parsed = parseHash(hash)
  const course = courses.find((item) => item.id === parsed.courseId) ?? courses[0] ?? null
  const index = indexes.find((item) => item.course.id === course?.id)
  const tree = index?.tree ?? []
  const flat = index?.flat ?? []
  const path = parsed.id ? findPath(tree, parsed.id) : null
  const active = path?.at(-1) ?? null
  const canRestore = !!course && library.some((item) => item.id === course.id) && drafts.some((item) => item.id === course.id)

  useEffect(() => {
    if (!course || courses.length === 0) return
    if (!window.location.hash) {
      const last = loadProgress().last
      if (last && courses.some((item) => item.id === last.courseId)) {
        window.location.replace(`#/${last.courseId}/${last.slideId}`)
        return
      }
      const firstItem = flat[0]
      window.location.replace(firstItem ? `#/${course.id}/${firstItem.item.id}` : `#/${course.id}`)
      return
    }
    if (parsed.courseId && !courses.some((item) => item.id === parsed.courseId)) {
      window.location.replace(`#/${course.id}`)
      return
    }
    if (parsed.id && !path) {
      const fallback = flat[0]
      window.location.replace(fallback ? `#/${course.id}/${fallback.item.id}` : `#/${course.id}`)
    }
  }, [course, courses, flat, parsed.courseId, parsed.id, path])

  useEffect(() => {
    if (!course || !active) return
    document.title = `${active.title} · ${course.title}`
    rememberLocation(course.id, active.id)
    setTabs((current) =>
      current.some((tab) => tab.courseId === course.id && tab.id === active.id)
        ? current
        : [...current, { courseId: course.id, id: active.id }],
    )
  }, [active, course])

  function openItem(courseId: string, id: string) {
    setHelpOpen(false)
    window.location.hash = `#/${courseId}/${id}`
  }

  useEffect(() => {
    if (!pendingOpen || !course) return
    if (!findPath(tree, pendingOpen)) return
    openItem(course.id, pendingOpen)
    setPendingOpen(null)
  }, [course, pendingOpen, tree])

  function commit(courseId: string, change: (course: CourseFile) => void) {
    setDrafts((current) => {
      const base = current.find((item) => item.id === courseId) ?? library.find((item) => item.id === courseId)
      if (!base) return current
      const next = structuredClone(base)
      change(next)
      return [...current.filter((item) => item.id !== courseId), next]
    })
  }

  function closeTab(courseId: string, id: string) {
    const remaining = tabs.filter((tab) => !(tab.courseId === courseId && tab.id === id))
    setTabs(remaining)
    if (course?.id === courseId && active?.id === id) {
      const neighbor = remaining[remaining.length - 1]
      window.location.hash = neighbor ? `#/${neighbor.courseId}/${neighbor.id}` : `#/${courseId}`
    }
  }

  function addNode(parentId: string | null, title: string) {
    if (!course) return
    const node: SlideNode = { id: newId('u'), parentId, title, content: '' }
    commit(course.id, (draft) => {
      draft.nodes.push(node)
    })
    setRenameId(node.id)
    setPanel('explorer')
    setPendingOpen(node.id)
  }

  function addTopic() {
    addNode(null, 'New topic')
  }

  function addSubtopic() {
    if (!active) return
    addNode(active.id, 'New subtopic')
  }

  function renameNode(id: string, title: string) {
    const next = title.trim()
    setRenameId(null)
    if (!course || !next) return
    commit(course.id, (draft) => {
      const node = draft.nodes.find((item) => item.id === id)
      if (node) node.title = next
    })
  }

  function updateContent(id: string, content: string) {
    if (!course) return
    commit(course.id, (draft) => {
      const node = draft.nodes.find((item) => item.id === id)
      if (node) node.content = content
    })
  }

  function placeImages(id: string, content: string, assets: Record<string, string>) {
    if (!course) return
    commit(course.id, (draft) => {
      const node = draft.nodes.find((item) => item.id === id)
      if (node) node.content = content
      draft.assets = { ...draft.assets, ...assets }
    })
  }

  function deleteNode(id: string) {
    if (!course) return
    const drop = new Set<string>()
    function collect(target: string) {
      drop.add(target)
      course.nodes.filter((node) => node.parentId === target).forEach((node) => collect(node.id))
    }
    collect(id)
    commit(course.id, (draft) => {
      draft.nodes = draft.nodes.filter((node) => !drop.has(node.id))
    })
    setTabs((current) => current.filter((tab) => !drop.has(tab.id)))
    if (active && drop.has(active.id)) {
      const neighbor = flat.find((item) => !drop.has(item.item.id))
      window.location.hash = neighbor ? `#/${course.id}/${neighbor.item.id}` : `#/${course.id}`
    }
  }

  function addCourse(title: string) {
    const nextTitle = title.trim()
    setCreatingCourse(false)
    if (!nextTitle) return
    const id = newId('c')
    const next: CourseFile = { format: courseFormat, version: 1, id, title: nextTitle, nodes: [] }
    setDrafts((current) => [...current, next])
    window.location.hash = `#/${id}`
  }

  function importCourse(next: CourseFile) {
    const taken = new Set(courses.map((item) => item.id))
    const id = taken.has(next.id) ? `${next.id}-${crypto.randomUUID().slice(0, 8)}` : next.id
    const copy = structuredClone(next)
    copy.id = id
    setDrafts((current) => [...current.filter((item) => item.id !== id), copy])
    setImportError(null)
    setPanel('explorer')
    const first = copy.nodes[0]
    window.location.hash = first ? `#/${id}/${first.id}` : `#/${id}`
  }

  function restoreCourse() {
    if (!course || !canRestore) return
    setDrafts((current) => current.filter((item) => item.id !== course.id))
  }

  const contentIndex = active ? flat.findIndex((item) => item.item.id === active.id) : -1
  const previous = contentIndex > 0 ? flat[contentIndex - 1] : null
  const next = contentIndex >= 0 && contentIndex < flat.length - 1 ? flat[contentIndex + 1] : null

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing =
        !!target &&
        (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      const key = event.key

      if ((event.metaKey || event.ctrlKey) && key.toLowerCase() === 'b') {
        event.preventDefault()
        setSidebarOpen((open) => !open)
        return
      }
      if ((event.metaKey || event.ctrlKey) && key.toLowerCase() === 'k') {
        event.preventDefault()
        setHelpOpen(false)
        setSidebarOpen(true)
        setPanel('search')
        return
      }
      if (helpOpen) {
        if (key === 'Escape') setHelpOpen(false)
        return
      }
      if (typing) return

      if (key === 'Escape' && presentation) {
        setPresentation(false)
        if (document.fullscreenElement) void document.exitFullscreen()
        return
      }
      if (key === 'Escape' && panel === 'search') {
        setPanel('explorer')
        return
      }
      if (key === 'p' || key === 'P') {
        setPresentation((value) => !value)
        return
      }
      if ((key === 'f' || key === 'F') && presentation) {
        if (document.fullscreenElement) void document.exitFullscreen()
        else void document.documentElement.requestFullscreen()
        return
      }
      if (key === '?') {
        setHelpOpen(true)
        return
      }
      if (!course) return

      if (key === 'ArrowRight' || key === 'PageDown' || (presentation && key === ' ')) {
        event.preventDefault()
        const targetItem = next?.item ?? (active ? firstSlide(active) : flat[0]?.item)
        if (targetItem && targetItem.id !== active?.id) openItem(course.id, targetItem.id)
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        event.preventDefault()
        if (previous) openItem(course.id, previous.item.id)
      } else if (key === 'Home' && flat[0]) {
        event.preventDefault()
        openItem(course.id, flat[0].item.id)
      } else if (key === 'End' && flat.length > 0) {
        event.preventDefault()
        openItem(course.id, flat[flat.length - 1].item.id)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, course, flat, helpOpen, next, panel, presentation, previous])

  const visibleTabs = tabs.flatMap((tab) => {
    const owner = indexes.find((item) => item.course.id === tab.courseId)
    const found = owner ? findPath(owner.tree, tab.id) : null
    const item = found?.at(-1)
    if (!owner || !item) return []
    return [{ ...tab, title: item.title }]
  })

  return {
    courses,
    course,
    tree,
    flat,
    path,
    active,
    panel,
    setPanel,
    sidebarOpen,
    setSidebarOpen,
    presentation,
    setPresentation,
    renameId,
    setRenameId,
    creatingCourse,
    setCreatingCourse,
    helpOpen,
    setHelpOpen,
    importError,
    setImportError,
    canRestore,
    visibleTabs,
    contentIndex,
    openItem,
    closeTab,
    addTopic,
    addSubtopic,
    renameNode,
    updateContent,
    placeImages,
    deleteNode,
    addCourse,
    importCourse,
    restoreCourse,
    indexes,
  }
}
