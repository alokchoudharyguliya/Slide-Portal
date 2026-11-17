import type { SlideNode } from './course'

export type TreeItem = {
  id: string
  title: string
  content: string
  children: TreeItem[]
}

export function buildTree(nodes: SlideNode[]): TreeItem[] {
  const items = new Map<string, TreeItem>()
  for (const node of nodes) {
    items.set(node.id, { id: node.id, title: node.title, content: node.content, children: [] })
  }
  const roots: TreeItem[] = []
  for (const node of nodes) {
    const item = items.get(node.id)
    if (!item) continue
    const parent = node.parentId ? items.get(node.parentId) : undefined
    if (parent && parent !== item) parent.children.push(item)
    else roots.push(item)
  }
  return roots
}

export function isSlide(item: TreeItem) {
  return item.content.trim().length > 0 || item.children.length === 0
}

export type FlatSlide = {
  item: TreeItem
  trail: string
}

export function flattenSlides(items: TreeItem[], ancestors: string[] = []): FlatSlide[] {
  const list: FlatSlide[] = []
  for (const item of items) {
    if (isSlide(item)) list.push({ item, trail: ancestors.join(' / ') })
    list.push(...flattenSlides(item.children, [...ancestors, item.title]))
  }
  return list
}

export function findPath(items: TreeItem[], id: string): TreeItem[] | null {
  for (const item of items) {
    if (item.id === id) return [item]
    const nested = findPath(item.children, id)
    if (nested) return [item, ...nested]
  }
  return null
}

export function firstSlide(item: TreeItem): TreeItem | null {
  if (isSlide(item)) return item
  for (const child of item.children) {
    const found = firstSlide(child)
    if (found) return found
  }
  return null
}
