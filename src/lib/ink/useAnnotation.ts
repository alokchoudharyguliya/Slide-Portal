import { useCallback, useEffect, useRef, useState } from 'react'
import { laserColors, markerColors, opacityFor, penColors } from './palette'
import { inkKey, loadInk, saveInk } from './store'
import type { Stroke, ToolKind } from './types'

export function useAnnotation(courseId: string | null, slideId: string | null) {
  const [on, setOn] = useState(false)
  const [kind, setKind] = useState<ToolKind>('pen')
  const [color, setColor] = useState(penColors[0].value)
  const [penWidth, setPenWidth] = useState(3.5)
  const [markerWidth, setMarkerWidth] = useState(18)
  const [laserWidth, setLaserWidth] = useState(4)
  const [eraserWidth, setEraserWidth] = useState(24)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [undoStack, setUndoStack] = useState<Stroke[][]>([])
  const [redoStack, setRedoStack] = useState<Stroke[][]>([])
  const keyRef = useRef<string | null>(null)
  const key = courseId && slideId ? inkKey(courseId, slideId) : null
  keyRef.current = key

  useEffect(() => {
    setStrokes(key ? loadInk(key) : [])
    setUndoStack([])
    setRedoStack([])
  }, [key])

  const replace = useCallback((next: Stroke[], recordUndo: Stroke[] | null) => {
    const currentKey = keyRef.current
    if (!currentKey) return
    if (recordUndo) {
      setUndoStack((stack) => [...stack.slice(-49), recordUndo])
      setRedoStack([])
    }
    setStrokes(next)
    saveInk(currentKey, next)
  }, [])

  const commit = useCallback(
    (previous: Stroke[], next: Stroke[]) => {
      if (previous === next) return
      replace(next, previous)
    },
    [replace],
  )

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      const previous = stack[stack.length - 1]
      if (!previous || !keyRef.current) return stack
      setStrokes((current) => {
        setRedoStack((redo) => [...redo, current])
        saveInk(keyRef.current as string, previous)
        return previous
      })
      return stack.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setRedoStack((stack) => {
      const next = stack[stack.length - 1]
      if (!next || !keyRef.current) return stack
      setStrokes((current) => {
        setUndoStack((undoList) => [...undoList, current])
        saveInk(keyRef.current as string, next)
        return next
      })
      return stack.slice(0, -1)
    })
  }, [])

  const clear = useCallback(() => {
    setStrokes((current) => {
      if (current.length === 0 || !keyRef.current) return current
      setUndoStack((stack) => [...stack.slice(-49), current])
      setRedoStack([])
      saveInk(keyRef.current, [])
      return []
    })
  }, [])

  useEffect(() => {
    if (!on) return
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing = !!target && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !typing) {
        event.preventDefault()
        event.stopPropagation()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setOn(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [on, redo, undo])

  const ruled = kind === 'line' || kind === 'arrow'
  const width = kind === 'marker' ? markerWidth : kind === 'pen' || ruled ? penWidth : kind === 'laser' ? laserWidth : eraserWidth
  const setWidth = (value: number) => {
    if (kind === 'marker') setMarkerWidth(value)
    else if (kind === 'pen' || kind === 'line' || kind === 'arrow') setPenWidth(value)
    else if (kind === 'laser') setLaserWidth(value)
    else setEraserWidth(value)
  }

  function chooseKind(next: ToolKind) {
    setKind(next)
    if ((next === 'pen' || next === 'line' || next === 'arrow') && !penColors.some((swatch) => swatch.value === color)) setColor(penColors[0].value)
    if (next === 'marker' && !markerColors.some((swatch) => swatch.value === color)) setColor(markerColors[0].value)
    if (next === 'laser' && !laserColors.some((swatch) => swatch.value === color)) setColor(laserColors[0].value)
  }

  return {
    on,
    setOn,
    kind,
    setKind: chooseKind,
    color,
    setColor,
    width,
    setWidth,
    opacity: opacityFor(kind),
    strokes,
    commit,
    undo,
    redo,
    clear,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  }
}

export type Annotation = ReturnType<typeof useAnnotation>
