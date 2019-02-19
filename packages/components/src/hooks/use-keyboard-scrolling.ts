import { RefObject, useState } from 'react'
import { FlatList, View } from 'react-native'

import { useEmitter } from './use-emitter'
import { useKeyDownCallback } from './use-key-down-callback'

export function useKeyboardScrolling(
  ref: RefObject<FlatList<any>>,
  {
    columnId,
    getVisibleItemIndex,
    items,
  }: {
    columnId: string
    getVisibleItemIndex?: () => number | undefined
    items: Array<{ [key: string]: any; id: string | number } | undefined>
  },
) {
  const [selectedId, setSelectedId] = useState<string | number | null>(null)

  useKeyDownCallback(
    e => {
      if (!ref.current) return

      if (e.key === 'Escape') {
        if (e.defaultPrevented) return
        setSelectedId(null)
      }
    },
    undefined,
    [],
  )

  useEmitter(
    'SCROLL_UP_COLUMN',
    (payload: { columnId: string }) => {
      if (!ref.current) return
      if (columnId !== payload.columnId) return

      const selectedIndex = items.findIndex(i => !!(i && i.id === selectedId))
      const newIndex = !selectedId
        ? (getVisibleItemIndex && getVisibleItemIndex()) || 0
        : Math.max(0, Math.min(selectedIndex - 1, items.length - 1))
      const item = items[newIndex]

      ref.current.scrollToItem({
        animated: true,
        item,
        viewPosition: 0.5,
      })

      setSelectedId((item && item.id) || null)
    },
    [ref && ref.current, columnId, items, getVisibleItemIndex, selectedId],
  )

  useEmitter(
    'SCROLL_DOWN_COLUMN',
    (payload: { columnId: string }) => {
      if (!ref.current) return
      if (columnId !== payload.columnId) return

      const selectedIndex = items.findIndex(i => !!(i && i.id === selectedId))
      const newIndex = !selectedId
        ? (getVisibleItemIndex && getVisibleItemIndex()) || 0
        : Math.max(0, Math.min(selectedIndex + 1, items.length - 1))
      const item = items[newIndex]

      ref.current.scrollToItem({
        animated: true,
        item,
        viewPosition: 0.5,
      })

      setSelectedId((item && item.id) || null)
    },
    [ref && ref.current, columnId, getVisibleItemIndex, items, selectedId],
  )

  useEmitter(
    'FOCUS_ON_COLUMN',
    payload => {
      if (!ref.current) return
      if (columnId !== payload.columnId) return
      if (!getVisibleItemIndex) return

      const index = payload.focusOnVisibleItem ? getVisibleItemIndex() || 0 : -1
      const newIndex = Math.max(-1, Math.min(index, items.length - 1))
      const item = items[newIndex]

      setSelectedId((item && item.id) || null)
    },
    [ref && ref.current, columnId, getVisibleItemIndex, items, length],
  )

  return [selectedId, setSelectedId] as [
    typeof selectedId,
    typeof setSelectedId
  ]
}
