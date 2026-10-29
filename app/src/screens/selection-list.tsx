import { useWindowSize } from '@gpuix/react'
import type { ReactNode } from 'react'

import { usePalette, withAlpha } from '../theme'
import { Pressable, useStore } from '../ui/kit'

const ROW_HEIGHT = 40
/** Top bar, hint bar, header card and paddings around the list. */
const LIST_CHROME_HEIGHT = 300

/** How many rows fit the window, at least four. */
export function useVisibleRows(chrome = LIST_CHROME_HEIGHT): number {
  const { height } = useWindowSize()
  return Math.max(4, Math.floor((height - chrome) / ROW_HEIGHT))
}

/** First index of a window of `visible` rows that keeps `selected` centered. */
export function windowStart(total: number, selected: number, visible: number): number {
  const centered = selected - Math.floor(visible / 2)
  return Math.max(0, Math.min(centered, total - visible))
}

type SelectionListProps<T> = {
  items: T[]
  /** `null` until the screen selects its first row. */
  selected: number | null
  /** Key that confirms the selected row. */
  confirmKey: string
  testIdPrefix: string
  renderRow: (item: T, index: number, isSelected: boolean) => ReactNode
}

/**
 * The j/k list of gittype's selection screens. A click walks the selection
 * to the row with ↑/↓; a click on the selected row confirms it.
 */
export function SelectionList<T>({ items, selected, confirmKey, testIdPrefix, renderRow }: SelectionListProps<T>) {
  const palette = usePalette()
  const store = useStore()
  const visible = useVisibleRows()
  const current = selected ?? 0
  const start = windowStart(items.length, current, visible)

  const onRowPress = (index: number) => {
    const steps = index - current
    if (steps === 0) store.press(confirmKey)
    else store.pressRepeated(steps > 0 ? 'down' : 'up', Math.abs(steps))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {items.slice(start, start + visible).map((item, offset) => {
        const index = start + offset
        const isSelected = index === selected
        return (
          <Pressable
            key={index}
            testId={`${testIdPrefix}-${index}`}
            onPress={() => onRowPress(index)}
            hoverBackground={withAlpha(palette.keyAction, 0.1)}
            style={{
              height: ROW_HEIGHT - 2,
              gap: 12,
              paddingLeft: 14,
              paddingRight: 14,
              borderWidth: 1,
              borderColor: isSelected ? withAlpha(palette.keyAction, 0.8) : withAlpha(palette.border, 0),
              backgroundColor: isSelected ? withAlpha(palette.keyAction, 0.12) : undefined,
            }}
          >
            {renderRow(item, index, isSelected)}
          </Pressable>
        )
      })}
    </div>
  )
}
