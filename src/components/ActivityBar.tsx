import { Files, PenLine, Play, Search, Settings, Video } from 'lucide-react'
import type { Panel } from '../lib/useWorkspace'

export function ActivityBar({
  panel,
  sidebarOpen,
  presentation,
  onExplorer,
  onSearch,
  onPresent,
  onHelp,
  inkOn,
  onInk,
  cameraOn,
  onCamera,
}: {
  panel: Panel
  sidebarOpen: boolean
  presentation: boolean
  onExplorer: () => void
  onSearch: () => void
  onPresent: () => void
  onHelp: () => void
  inkOn: boolean
  onInk: () => void
  cameraOn: boolean
  onCamera: () => void
}) {
  return (
    <nav className="wb-activity" aria-label="Activity bar">
      <div>
        <button
          type="button"
          title="Explorer"
          aria-label="Explorer"
          className={panel === 'explorer' && sidebarOpen ? 'active' : ''}
          onClick={onExplorer}
        >
          <Files />
        </button>
        <button
          type="button"
          title="Search"
          aria-label="Search"
          className={panel === 'search' && sidebarOpen ? 'active' : ''}
          onClick={onSearch}
        >
          <Search />
        </button>
        <button
          type="button"
          title="Annotate"
          aria-label="Annotate"
          aria-pressed={inkOn}
          className={inkOn ? 'active' : ''}
          onClick={onInk}
        >
          <PenLine />
        </button>
        <button
          type="button"
          title="Camera"
          aria-label="Camera"
          aria-pressed={cameraOn}
          className={cameraOn ? 'active' : ''}
          onClick={onCamera}
        >
          <Video />
        </button>
        <button
          type="button"
          title="Presentation"
          aria-label="Presentation"
          className={presentation ? 'active' : ''}
          onClick={onPresent}
        >
          <Play />
        </button>
      </div>
      <button type="button" title="Keyboard shortcuts" aria-label="Keyboard shortcuts" onClick={onHelp}>
        <Settings />
      </button>
    </nav>
  )
}
