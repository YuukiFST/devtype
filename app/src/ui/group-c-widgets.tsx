import { useRef, type ReactNode } from 'react'

import type { EngineStore } from '../engine-store'
import { usePalette, withAlpha, type Palette } from '../theme'
import { Pressable, Txt } from './kit'

/**
 * Secondary text that stays legible on every theme: some gittype themes set
 * `textSecondary` close to the background, which a terminal shows but a GUI washes out.
 */
export function mutedColor(palette: Palette): string {
  return withAlpha(palette.text, 0.6)
}

/**
 * First visible row of a list window. Like ratatui's ListState offset, it moves
 * only as far as needed to keep `selected` in view, so the list does not jump.
 */
export function useScrollWindow(selected: number | null, count: number, visible: number): number {
  const startRef = useRef(0)
  let start = Math.max(0, Math.min(startRef.current, count - visible))
  if (selected !== null) {
    if (selected < start) start = selected
    else if (selected >= start + visible) start = selected - visible + 1
  }
  startRef.current = start
  return start
}

/**
 * Walks a list selection to a clicked row with ↑/↓ presses. Clicking the
 * selected row sends `activateKey`. From no selection, the first ↓ selects row 0.
 */
export function selectListRow(store: EngineStore, selected: number | null, index: number, activateKey?: string) {
  if (selected === index) {
    if (activateKey) store.press(activateKey)
    return
  }
  if (selected === null) {
    store.pressRepeated('down', index + 1)
    return
  }
  const steps = index - selected
  store.pressRepeated(steps > 0 ? 'down' : 'up', Math.abs(steps))
}

/** A clickable list row with the selected-row highlight shared by every list screen. */
export function ListRow({
  selected,
  onPress,
  children,
  height = 36,
  testId,
}: {
  selected: boolean
  onPress: () => void
  children: ReactNode
  height?: number
  testId?: string
}) {
  const palette = usePalette()
  return (
    <Pressable
      testId={testId}
      onPress={onPress}
      hoverBackground={withAlpha(palette.keyAction, selected ? 0.22 : 0.08)}
      style={{
        height,
        flexShrink: 0,
        gap: 12,
        paddingLeft: 12,
        paddingRight: 12,
        borderWidth: 1,
        borderColor: selected ? withAlpha(palette.keyAction, 0.7) : withAlpha(palette.border, 0),
        backgroundColor: selected ? withAlpha(palette.keyAction, 0.16) : withAlpha(palette.background, 0),
      }}
    >
      {children}
    </Pressable>
  )
}

/** `label` in its metric color, value right-aligned: one line of a details panel. */
export function MetricLine({ label, value, color }: { label: string; value: string; color: string }) {
  const palette = usePalette()
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, height: 22 }}>
      <Txt color={color} size={13} wrap={false}>
        {label}
      </Txt>
      <div style={{ flexGrow: 1 }} />
      <Txt color={palette.text} size={13} weight={600} mono wrap={false}>
        {value}
      </Txt>
    </div>
  )
}

/** A fixed-width table cell. */
export function Cell({
  children,
  width,
  grow,
  align = 'left',
  color,
  mono = true,
  weight = 400,
}: {
  children: ReactNode
  width?: number
  grow?: boolean
  align?: 'left' | 'right'
  color?: string
  mono?: boolean
  weight?: number
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        width,
        flexGrow: grow ? 1 : 0,
        flexShrink: grow ? 1 : 0,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <Txt color={color} size={13} mono={mono} weight={weight} wrap={false}>
        {children}
      </Txt>
    </div>
  )
}
