import { ChevronDown, ChevronRight, File, FilePlus, Folder, FolderPlus, FoldVertical, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CourseFile } from '../lib/course'
import type { TreeItem } from '../lib/tree'

type OutlineItem = {
  level: number
  text: string
}

export function Explorer({
  courses,
  course,
  tree,
  activeId,
  renameId,
  creatingCourse,
  outline,
  onOpen,
  onNewTopic,
  onNewSubtopic,
  onRename,
  onStartRename,
  onCancelRename,
  onDelete,
  onCreateCourse,
  onStartCourse,
  onCancelCourse,
  onSwitchCourse,
  onImport,
  onExport,
  onRestore,
  canRestore,
}: {
  courses: CourseFile[]
  course: CourseFile | null
  tree: TreeItem[]
  activeId?: string
  renameId: string | null
  creatingCourse: boolean
  outline: OutlineItem[]
  onOpen: (id: string) => void
  onNewTopic: () => void
  onNewSubtopic: () => void
  onRename: (id: string, title: string) => void
  onStartRename: (id: string) => void
  onCancelRename: () => void
  onDelete: (id: string) => void
  onCreateCourse: (title: string) => void
  onStartCourse: () => void
  onCancelCourse: () => void
  onSwitchCourse: (courseId: string) => void
  onImport: () => void
  onExport: () => void
  onRestore: () => void
  canRestore: boolean
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [courseMenu, setCourseMenu] = useState(false)
  const [outlineOpen, setOutlineOpen] = useState(true)

  useEffect(() => {
    if (!activeId) return
    const ancestors = ancestorIds(tree, activeId)
    if (!ancestors || ancestors.length === 0) return
    setExpanded((current) => {
      const next = { ...current }
      for (const id of ancestors) next[id] = true
      return next
    })
  }, [activeId, tree])

  return (
    <aside className="wb-side">
      <div className="wb-title">Explorer</div>
      <div className="wb-section-head">
        <button type="button" className="wb-section-name" onClick={() => setCourseMenu((open) => !open)}>
          <ChevronDown className={courseMenu ? '' : '-rotate-90'} />
          <span>{course?.title ?? 'No course'}</span>
        </button>
        <div className="wb-section-actions">
          <button type="button" title="New Topic" aria-label="New Topic" onClick={onNewTopic}>
            <FolderPlus />
          </button>
          <button type="button" title="New Subtopic" aria-label="New Subtopic" disabled={!activeId} onClick={onNewSubtopic}>
            <FilePlus />
          </button>
          <button type="button" title="Collapse All" aria-label="Collapse All" onClick={() => setExpanded({})}>
            <FoldVertical />
          </button>
        </div>
      </div>
      {courseMenu && (
        <div className="wb-course-menu">
          {courses.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === course?.id ? 'active' : ''}
              onClick={() => {
                onSwitchCourse(item.id)
                setCourseMenu(false)
              }}
            >
              {item.title}
            </button>
          ))}
          {creatingCourse ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                const data = new FormData(event.currentTarget)
                onCreateCourse(String(data.get('title') ?? ''))
              }}
            >
              <input name="title" autoFocus placeholder="Course name" aria-label="Course name" onBlur={onCancelCourse} />
            </form>
          ) : (
            <button type="button" onClick={onStartCourse}>
              New course…
            </button>
          )}
          <button type="button" onClick={onImport}>
            Import course…
          </button>
          <button type="button" onClick={onExport} disabled={!course}>
            Export course
          </button>
          {canRestore && (
            <button type="button" onClick={onRestore}>
              Restore original
            </button>
          )}
        </div>
      )}
      <div className="wb-tree" role="tree" aria-label="Topics">
        {tree.map((item) => (
          <TreeRow
            key={item.id}
            item={item}
            depth={0}
            activeId={activeId}
            renameId={renameId}
            expanded={expanded}
            onToggle={(id) => setExpanded((current) => ({ ...current, [id]: !current[id] }))}
            onOpen={onOpen}
            onRename={onRename}
            onStartRename={onStartRename}
            onCancelRename={onCancelRename}
            onDelete={onDelete}
          />
        ))}
      </div>
      <section className="wb-outline">
        <button type="button" className="wb-section-head wb-outline-toggle" onClick={() => setOutlineOpen((open) => !open)}>
          <ChevronDown className={outlineOpen ? '' : '-rotate-90'} />
          <span>Outline</span>
        </button>
        {outlineOpen && (
          <div className="wb-outline-list">
            {outline.length === 0 && <p className="wb-muted">No headings in this slide.</p>}
            {outline.map((item, index) => (
              <button
                key={`${item.text}-${index}`}
                type="button"
                className="wb-outline-item"
                style={{ paddingLeft: 8 + (item.level - 1) * 12 }}
                onClick={() => {
                  const headings = document.querySelectorAll('.editor-preview h1, .editor-preview h2, .editor-preview h3')
                  headings[index]?.scrollIntoView({ block: 'start' })
                }}
              >
                {item.text}
              </button>
            ))}
          </div>
        )}
      </section>
    </aside>
  )
}

function TreeRow({
  item,
  depth,
  activeId,
  renameId,
  expanded,
  onToggle,
  onOpen,
  onRename,
  onStartRename,
  onCancelRename,
  onDelete,
}: {
  item: TreeItem
  depth: number
  activeId?: string
  renameId: string | null
  expanded: Record<string, boolean>
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onRename: (id: string, title: string) => void
  onStartRename: (id: string) => void
  onCancelRename: () => void
  onDelete: (id: string) => void
}) {
  const skipRename = useRef(false)
  const hasChildren = item.children.length > 0
  const isOpen = expanded[item.id] ?? false
  const selected = item.id === activeId
  const renaming = item.id === renameId
  const Icon = hasChildren ? Folder : File

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isOpen : undefined} aria-selected={selected}>
      <div className={`wb-row ${selected ? 'active' : ''}`} style={{ paddingLeft: 4 + depth * 12 }}>
        {hasChildren ? (
          <button type="button" className="wb-twist" aria-label={isOpen ? 'Collapse' : 'Expand'} onClick={() => onToggle(item.id)}>
            {isOpen ? <ChevronDown /> : <ChevronRight />}
          </button>
        ) : (
          <span className="wb-twist" />
        )}
        <Icon className={hasChildren ? 'folder' : 'file'} />
        {renaming ? (
          <input
            className="wb-rename"
            autoFocus
            defaultValue={item.title}
            aria-label="Rename topic"
            onClick={(event) => event.stopPropagation()}
            onBlur={(event) => {
              if (skipRename.current) {
                skipRename.current = false
                return
              }
              onRename(item.id, event.currentTarget.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onRename(item.id, event.currentTarget.value)
              }
              if (event.key === 'Escape') {
                skipRename.current = true
                onCancelRename()
                event.currentTarget.blur()
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="wb-label"
            onClick={() => onOpen(item.id)}
            onDoubleClick={() => onStartRename(item.id)}
          >
            {item.title}
          </button>
        )}
        {!renaming && (
          <button type="button" className="wb-trash" aria-label={`Delete ${item.title}`} onClick={() => onDelete(item.id)}>
            <Trash2 />
          </button>
        )}
      </div>
      {hasChildren && isOpen &&
        item.children.map((child) => (
          <TreeRow
            key={child.id}
            item={child}
            depth={depth + 1}
            activeId={activeId}
            renameId={renameId}
            expanded={expanded}
            onToggle={onToggle}
            onOpen={onOpen}
            onRename={onRename}
            onStartRename={onStartRename}
            onCancelRename={onCancelRename}
            onDelete={onDelete}
          />
        ))}
    </div>
  )
}

function ancestorIds(items: TreeItem[], id: string): string[] | null {
  for (const item of items) {
    if (item.id === id) return []
    const nested = ancestorIds(item.children, id)
    if (nested) return [item.id, ...nested]
  }
  return null
}

export function SearchPane({
  entries,
  onOpen,
}: {
  entries: { courseId: string; courseTitle: string; id: string; title: string; path: string; haystack: string }[]
  onOpen: (courseId: string, id: string) => void
}) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const results = needle ? entries.filter((entry) => entry.haystack.includes(needle)).slice(0, 40) : entries.slice(0, 20)

  return (
    <div className="wb-search">
      <input
        autoFocus
        value={query}
        placeholder="Search topics"
        aria-label="Search topics"
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="wb-search-list">
        {results.length === 0 && <p className="wb-muted">No matching topics.</p>}
        {results.map((entry) => (
          <button key={`${entry.courseId}:${entry.id}`} type="button" onClick={() => onOpen(entry.courseId, entry.id)}>
            <span>{entry.title}</span>
            <small>
              {entry.courseTitle} · {entry.path}
            </small>
          </button>
        ))}
      </div>
    </div>
  )
}
