export function StatusBar({
  courseTitle,
  index,
  total,
  presentation,
  onToggle,
  onExportPdf,
  inkOn,
  onInk,
  cameraOn,
  onCamera,
}: {
  courseTitle: string
  index: number
  total: number
  presentation: boolean
  onToggle: () => void
  onExportPdf: () => void
  inkOn: boolean
  onInk: () => void
  cameraOn: boolean
  onCamera: () => void
}) {
  const label = index > 0 ? `Slide ${index} of ${total}` : 'No slide open'

  return (
    <footer className="wb-status">
      <div className="wb-status-left">
        <span>{courseTitle}</span>
        <span>{label}</span>
      </div>
      <div className="wb-status-right">
        <button type="button" onClick={onInk} aria-pressed={inkOn}>
          {inkOn ? 'Annotating' : 'Annotate'}
        </button>
        <button type="button" onClick={onCamera} aria-pressed={cameraOn}>
          {cameraOn ? 'Camera on' : 'Camera'}
        </button>
        <button type="button" onClick={onExportPdf}>
          Export PDF
        </button>
        <button type="button" onClick={onToggle}>
          {presentation ? 'Presentation' : 'Interactive Mode'}
        </button>
        <span>Markdown</span>
      </div>
    </footer>
  )
}
