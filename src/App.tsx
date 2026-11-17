import { useMemo, useRef, useState } from 'react'
import { ActivityBar } from './components/ActivityBar'
import { CameraPane } from './components/CameraPane'
import { EditorGroup } from './components/EditorGroup'
import { Explorer, SearchPane } from './components/Explorer'
import { HelpDialog } from './components/HelpDialog'
import { PrintDeck } from './components/PrintDeck'
import { StatusBar } from './components/StatusBar'
import { downloadCourse, parseCourse } from './lib/course'
import { useAnnotation } from './lib/ink/useAnnotation'
import type { TreeItem } from './lib/tree'
import { useWorkspace } from './lib/useWorkspace'

type OutlineItem = { level: number; text: string }

export default function App() {
  const workspace = useWorkspace()
  const [outline, setOutline] = useState<OutlineItem[]>([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { course, active } = workspace
  const annotation = useAnnotation(course?.id ?? null, active?.id ?? null)

  const entries = useMemo(() => {
    const list: { courseId: string; courseTitle: string; id: string; title: string; path: string; haystack: string }[] = []
    for (const index of workspace.indexes) {
      walk(index.tree, [], index.course.id, index.course.title, list)
    }
    return list
  }, [workspace.indexes])

  return (
    <div className={`wb ${workspace.presentation ? 'presenting' : ''}`}>
      <div className="wb-main">
        {!workspace.presentation && (
          <ActivityBar
            panel={workspace.panel}
            sidebarOpen={workspace.sidebarOpen}
            presentation={workspace.presentation}
            onExplorer={() => {
              if (workspace.panel === 'explorer' && workspace.sidebarOpen) workspace.setSidebarOpen(false)
              else {
                workspace.setPanel('explorer')
                workspace.setSidebarOpen(true)
              }
            }}
            onSearch={() => {
              if (workspace.panel === 'search' && workspace.sidebarOpen) workspace.setSidebarOpen(false)
              else {
                workspace.setPanel('search')
                workspace.setSidebarOpen(true)
              }
            }}
            onPresent={() => workspace.setPresentation((value) => !value)}
            onHelp={() => workspace.setHelpOpen(true)}
            inkOn={annotation.on}
            onInk={() => annotation.setOn((value) => !value)}
            cameraOn={cameraOpen}
            onCamera={() => setCameraOpen((value) => !value)}
          />
        )}
        {!workspace.presentation && workspace.sidebarOpen && workspace.panel === 'explorer' && (
          <Explorer
            courses={workspace.courses}
            course={course}
            tree={workspace.tree}
            activeId={active?.id}
            renameId={workspace.renameId}
            creatingCourse={workspace.creatingCourse}
            outline={outline}
            canRestore={workspace.canRestore}
            onOpen={(id) => course && workspace.openItem(course.id, id)}
            onNewTopic={workspace.addTopic}
            onNewSubtopic={workspace.addSubtopic}
            onRename={workspace.renameNode}
            onStartRename={workspace.setRenameId}
            onCancelRename={() => workspace.setRenameId(null)}
            onDelete={workspace.deleteNode}
            onCreateCourse={workspace.addCourse}
            onStartCourse={() => workspace.setCreatingCourse(true)}
            onCancelCourse={() => workspace.setCreatingCourse(false)}
            onImport={() => fileRef.current?.click()}
            onExport={() => course && downloadCourse(course)}
            onRestore={workspace.restoreCourse}
            onSwitchCourse={(courseId) => {
              const next = workspace.indexes.find((item) => item.course.id === courseId)
              const first = next?.flat[0]
              if (first) workspace.openItem(courseId, first.item.id)
              else window.location.hash = `#/${courseId}`
            }}
          />
        )}
        {!workspace.presentation && workspace.sidebarOpen && workspace.panel === 'search' && (
          <aside className="wb-side">
            <div className="wb-title">Search</div>
            <SearchPane entries={entries} onOpen={workspace.openItem} />
          </aside>
        )}
        <EditorGroup
          course={course}
          tabs={workspace.visibleTabs}
          active={active}
          path={workspace.path}
          presentation={workspace.presentation}
          onOpen={workspace.openItem}
          onClose={workspace.closeTab}
          onUpdate={workspace.updateContent}
          onOutline={setOutline}
          annotation={annotation}
          assets={course?.assets}
          onPlaceImages={workspace.placeImages}
        />
        {cameraOpen && <CameraPane onClose={() => setCameraOpen(false)} />}
      </div>
      <StatusBar
        courseTitle={course?.title ?? 'Slide Portal'}
        index={workspace.contentIndex >= 0 ? workspace.contentIndex + 1 : 0}
        total={workspace.flat.length}
        presentation={workspace.presentation}
        onToggle={() => workspace.setPresentation((value) => !value)}
        onExportPdf={() => window.print()}
        inkOn={annotation.on}
        onInk={() => annotation.setOn((value) => !value)}
        cameraOn={cameraOpen}
        onCamera={() => setCameraOpen((value) => !value)}
      />
      {workspace.helpOpen && <HelpDialog onClose={() => workspace.setHelpOpen(false)} />}
      {course && <PrintDeck courseTitle={course.title} slides={workspace.flat} assets={course.assets} />}
      <input
        ref={fileRef}
        className="wb-file"
        type="file"
        accept="application/json,.json"
        aria-label="Import course file"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          void file.text().then((text) => {
            const parsed = parseCourse(text)
            if (!parsed) {
              workspace.setImportError('That file is not a Slide Portal course.')
              return
            }
            workspace.importCourse(parsed)
          })
        }}
      />
      {workspace.importError && (
        <button type="button" className="wb-import-error" onClick={() => workspace.setImportError(null)}>
          {workspace.importError}
        </button>
      )}
    </div>
  )
}

function walk(
  items: TreeItem[],
  trail: string[],
  courseId: string,
  courseTitle: string,
  list: { courseId: string; courseTitle: string; id: string; title: string; path: string; haystack: string }[],
) {
  for (const item of items) {
    const path = [...trail, item.title]
    list.push({
      courseId,
      courseTitle,
      id: item.id,
      title: item.title,
      path: path.join(' / '),
      haystack: [item.title, item.content].join('\n').toLowerCase(),
    })
    walk(item.children, path, courseId, courseTitle, list)
  }
}
