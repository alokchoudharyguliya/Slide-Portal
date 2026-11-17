import { X } from 'lucide-react'

const shortcuts = [
  ['←  →', 'Previous and next slide'],
  ['Home / End', 'First and last slide in the course'],
  ['⌘B  or  Ctrl B', 'Show or hide the explorer'],
  ['⌘K  or  Ctrl K', 'Search topics'],
  ['P', 'Presentation mode'],
  ['Space', 'Next slide while presenting'],
  ['F', 'Full screen while presenting'],
  ['Esc', 'Put the pen down, then leave presentation or search'],
  ['⌘Z', 'Undo a stroke while annotating'],
  ['⌘V', 'Paste an image onto the open slide'],
  ['?', 'Show these shortcuts'],
]

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="wb-modal" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" className="wb-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <div className="wb-dialog-head">
          <h2>Keyboard shortcuts</h2>
          <button type="button" aria-label="Close shortcuts" onClick={onClose}>
            <X />
          </button>
        </div>
        <ul>
          {shortcuts.map(([keys, action]) => (
            <li key={keys}>
              <span>{action}</span>
              <kbd>{keys}</kbd>
            </li>
          ))}
        </ul>
        <p>
          Every slide is Markdown. Paste an image and it is added to the slide. Annotate draws with a pen, a marker, a straight line, an arrow, a stroke eraser, and an area eraser. Those strokes stay on that slide in this browser. The laser fades about a second after you lift the pointer and is not saved. Camera opens a self-view on the right of the slide.
        </p>
      </div>
    </div>
  )
}
