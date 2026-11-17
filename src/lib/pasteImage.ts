const maxEdge = 1280

export function imageFilesFromClipboard(data: DataTransfer | null) {
  if (!data) return []
  const fromFiles = [...data.files].filter((file) => file.type.startsWith('image/'))
  if (fromFiles.length > 0) return fromFiles
  const fromItems: File[] = []
  for (const item of data.items) {
    if (item.kind !== 'file' || !item.type.startsWith('image/')) continue
    const file = item.getAsFile()
    if (file) fromItems.push(file)
  }
  return fromItems
}

export function insertMarkdown(content: string, block: string, start: number, end = start) {
  const from = Math.max(0, Math.min(start, content.length))
  const to = Math.max(from, Math.min(end, content.length))
  const before = content.slice(0, from)
  const after = content.slice(to)
  const lead = before.length === 0 || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  const tail = after.length === 0 || after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n'
  return `${before}${lead}${block}${tail}${after}`
}

export function markdownBlocks(content: string) {
  const blocks: { start: number; end: number }[] = []
  let index = 0
  while (index < content.length) {
    while (content[index] === '\n') index += 1
    if (index >= content.length) break
    const start = index
    if (content.startsWith('```', index)) {
      const close = content.indexOf('\n```', index + 3)
      index = close === -1 ? content.length : close + 4
    } else {
      const gap = content.indexOf('\n\n', index)
      index = gap === -1 ? content.length : gap
    }
    blocks.push({ start, end: index })
  }
  return blocks
}

export async function filesToAssets(files: File[]) {
  return Promise.all(
    files.map(async (file) => {
      const id = `img-${crypto.randomUUID()}`
      return { id, dataUrl: await compressImage(file), markdown: `![Pasted image](asset:${id})` }
    }),
  )
}

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file)
  try {
    const photo = file.type === 'image/jpeg'
    const type = photo ? 'image/jpeg' : 'image/png'
    const fitted = await encode(bitmap, maxEdge, type, photo ? 0.86 : undefined)
    if (fitted.length < 1_200_000) return fitted
    return encode(bitmap, 960, 'image/jpeg', 0.8)
  } finally {
    bitmap.close()
  }
}

async function encode(bitmap: ImageBitmap, edge: number, type: string, quality?: number) {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not draw the pasted image.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  if (!blob) throw new Error('Could not encode the pasted image.')
  return readDataUrl(blob)
}

function readDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the pasted image.'))
    reader.readAsDataURL(blob)
  })
}
