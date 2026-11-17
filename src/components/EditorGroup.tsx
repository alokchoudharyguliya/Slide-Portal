import { File, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CourseFile } from '../lib/course'
import type { TreeItem } from '../lib/tree'
import type { Annotation } from '../lib/ink/useAnnotation'
import { filesToAssets, imageFilesFromClipboard, insertMarkdown, markdownBlocks } from '../lib/pasteImage'
import { InkBar } from './InkBar'
import { InkSurface } from './InkSurface'
import { MarkdownView } from './MarkdownView'

type OutlineItem = { level: number; text: string }

type OpenTab = { courseId: string; id: string; title: string }

export function EditorGroup({
  course,
  tabs,
  active,
  path,
  presentation,
  onOpen,
  onClose,
  onUpdate,
  onOutline,
  annotation,
  assets,
  onPlaceImages,
}: {
  course: CourseFile | null
  tabs: OpenTab[]
  active: TreeItem | null
  path: TreeItem[] | null
  presentation: boolean
  onOpen: (courseId: string, id: string) => void
  onClose: (courseId: string, id: string) => void
  onUpdate: (id: string, content: string) => void
  onOutline: (items: OutlineItem[]) => void
  annotation: Annotation
  assets?: Record<string, string>
  onPlaceImages: (id: string, content: string, assets: Record<string, string>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const content = active?.content ?? ''
  const showSource = !!active && editing && !presentation
  const pasteRef = useRef({ active, content, onPlaceImages })
  const pointRef = useRef<{ x: number; y: number } | null>(null)
  pasteRef.current = { active, content, onPlaceImages }

  useEffect(() => {
    function rememberPoint(event: PointerEvent) {
      const target = event.target
      const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null
      if (!element?.closest('.slide-sheet')) return
      pointRef.current = { x: event.clientX, y: event.clientY }
    }
    function onPaste(event: ClipboardEvent) {
      const slide = pasteRef.current.active
      if (!slide || foreignField(event.target)) return
      const files = imageFilesFromClipboard(event.clipboardData)
      if (files.length === 0) return
      event.preventDefault()
      const body = pasteRef.current.content
      const range = pasteRange(event, body, pointRef.current)
      void filesToAssets(files)
        .then((images) => {
          const markdown = images.map((image) => image.markdown).join('\n\n')
          const assets = Object.fromEntries(images.map((image) => [image.id, image.dataUrl]))
          pasteRef.current.onPlaceImages(slide.id, insertMarkdown(body, markdown, range.start, range.end), assets)
          setPasteError(null)
          setEditing(false)
          const marker = images[0]?.id
          requestAnimationFrame(() => {
            document.querySelector(`[data-asset="${marker}"]`)?.scrollIntoView({ block: 'nearest' })
          })
        })
        .catch(() => setPasteError('That image could not be pasted.'))
    }
    window.addEventListener('pointerdown', rememberPoint)
    window.addEventListener('pointermove', rememberPoint)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('pointerdown', rememberPoint)
      window.removeEventListener('pointermove', rememberPoint)
      window.removeEventListener('paste', onPaste)
    }
  }, [])

  useEffect(() => {
    setPasteError(null)
  }, [active?.id])

  useEffect(() => {
    if (annotation.on) {
      setEditing(false)
      return
    }
    setEditing((active?.content.trim().length ?? 0) === 0)
    // Reset the editor only when the open slide or the pen changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, annotation.on])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const root = document.querySelector('.editor-preview')
      if (!root) {
        onOutline([])
        return
      }
      const found = [...root.querySelectorAll('h1, h2, h3')]
        .map((element) => ({ level: Number(element.tagName[1]), text: (element.textContent ?? '').trim() }))
        .filter((item) => item.text)
      onOutline(found)
    })
    return () => cancelAnimationFrame(frame)
  }, [active?.id, content, onOutline, showSource])

  return (
    <section className="wb-editor">
      {!presentation && (
        <div className="wb-tabs" role="tablist" aria-label="Open slides">
          {tabs.map((tab) => {
            const selected = tab.id === active?.id && tab.courseId === course?.id
            return (
              <div key={`${tab.courseId}:${tab.id}`} className={`wb-tab ${selected ? 'active' : ''}`} role="tab" aria-selected={selected}>
                <button type="button" className="wb-tab-main" onClick={() => onOpen(tab.courseId, tab.id)}>
                  <File />
                  <span>{tab.title}</span>
                </button>
                <button type="button" className="wb-tab-close" aria-label={`Close ${tab.title}`} onClick={() => onClose(tab.courseId, tab.id)}>
                  <X />
                </button>
              </div>
            )
          })}
        </div>
      )}
      {!presentation && active && course && (
        <div className="wb-crumb">
          <span title={course.title}>{course.title}</span>
          {(path ?? []).map((item) => (
            <span key={item.id}>
              <i>›</i>
              <button type="button" title={item.title} onClick={() => onOpen(course.id, item.id)}>
                {item.title}
              </button>
            </span>
          ))}
          <div className="wb-mode">
            <button type="button" className={showSource ? 'active' : ''} onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className={!showSource ? 'active' : ''} onClick={() => setEditing(false)}>
              Preview
            </button>
          </div>
        </div>
      )}
      <div className="wb-canvas">
        {!active && (
          <div className="wb-welcome">
            <h1>{course?.title ?? 'Slide Portal'}</h1>
            {course?.description && <p>{course.description}</p>}
            <p>Open a topic from the explorer, or add one to teach next.</p>
            <p className="wb-muted">Every slide is Markdown. Export course saves the file. Export PDF prints one slide per page.</p>
          </div>
        )}
        {active && showSource && (
          <textarea
            className="wb-source"
            value={content}
            aria-label={`Content for ${active.title}`}
            placeholder={'Write this slide in Markdown.\n\n## Heading\n\n- A point to teach\n\n```python\nprint("hello")\n```'}
            onChange={(event) => onUpdate(active.id, event.target.value)}
          />
        )}
        {active && !showSource && (
          <div className={`slide-sheet ${annotation.on ? 'inking' : ''}`}>
            <div className="editor-preview">
              <h1 className="doc-title">{active.title}</h1>
              {content.trim() ? <MarkdownView content={content} assets={assets} /> : <p className="doc-subtitle">No content yet. Switch to Edit and write this slide in Markdown.</p>}
              {active.children.length > 0 && (
                <div className="topic-index">
                  {active.children.map((child) => (
                    <button key={child.id} type="button" onClick={() => course && onOpen(course.id, child.id)}>
                      {child.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <InkSurface key={active.id} annotation={annotation} />
          </div>
        )}
      </div>
      {pasteError && <p className="wb-paste-note">{pasteError}</p>}
      {annotation.on && active && !showSource && <InkBar annotation={annotation} />}
    </section>
  )
}

function pasteRange(event: ClipboardEvent, content: string, point: { x: number; y: number } | null) {
  const target = event.target
  if (target instanceof HTMLTextAreaElement && target.classList.contains('wb-source')) {
    return { start: target.selectionStart, end: target.selectionEnd }
  }
  return offsetInPreview(content, point)
}

function offsetInPreview(content: string, point: { x: number; y: number } | null) {
  const end = { start: content.length, end: content.length }
  if (!point) return end
  const root = document.querySelector('.editor-preview .prose-slide')
  const blocks = markdownBlocks(content)
  if (!root || blocks.length === 0) return { start: 0, end: 0 }
  const children = [...root.children]
  if (children.length === 0) return { start: blocks[0].start, end: blocks[0].start }
  const first = children[0].getBoundingClientRect()
  if (point.y < first.top) return { start: blocks[0].start, end: blocks[0].start }
  for (let index = 0; index < children.length; index += 1) {
    const rect = children[index].getBoundingClientRect()
    if (point.y > rect.bottom) continue
    const block = blocks[Math.min(index, blocks.length - 1)]
    const at = point.y < rect.top + rect.height / 2 ? block.start : block.end
    return { start: at, end: at }
  }
  const last = blocks[blocks.length - 1]
  return { start: last.end, end: last.end }
}

function foreignField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.classList.contains('wb-source')) return false
  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
}
