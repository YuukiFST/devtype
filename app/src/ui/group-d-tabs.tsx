import { usePalette, withAlpha } from '../theme'
import { Pressable, Txt, useStore } from './kit'

type TabBarProps = {
  tabs: string[]
  selectedIndex: number
  /** Keys the screen uses to move between tabs; tabs wrap around. */
  previousKey?: string
  nextKey?: string
  testIdPrefix?: string
}

/** Clickable tab strip; a click walks the screen's own ←/→ selection to the tab. */
export function TabBar({ tabs, selectedIndex, previousKey = 'left', nextKey = 'right', testIdPrefix = 'tab' }: TabBarProps) {
  const palette = usePalette()
  const store = useStore()

  const selectTab = (index: number) => {
    const steps = index - selectedIndex
    if (steps !== 0) store.pressRepeated(steps > 0 ? nextKey : previousKey, Math.abs(steps))
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        padding: 4,
        borderRadius: 12,
        backgroundColor: palette.backgroundSecondary,
        borderWidth: 1,
        borderColor: withAlpha(palette.border, 0.45),
      }}
    >
      {tabs.map((tab, index) => {
        const isSelected = index === selectedIndex
        return (
          <Pressable
            key={tab}
            testId={`${testIdPrefix}-${index}`}
            onPress={() => selectTab(index)}
            hoverBackground={withAlpha(palette.keyAction, 0.1)}
            style={{
              paddingLeft: 14,
              paddingRight: 14,
              paddingTop: 7,
              paddingBottom: 7,
              borderRadius: 9,
              backgroundColor: isSelected ? withAlpha(palette.keyAction, 0.18) : undefined,
            }}
          >
            <Txt color={isSelected ? palette.title : palette.text} size={13} weight={isSelected ? 700 : 400} wrap={false}>
              {tab}
            </Txt>
          </Pressable>
        )
      })}
    </div>
  )
}

type SelectableRowProps = {
  label: string
  index: number
  selectedIndex: number | null
  /** Key the screen treats as "select" when the highlighted row is clicked again. */
  selectKey: string
  testId?: string
}

/** A list row that moves the screen's ↑/↓ selection to itself on click. */
export function SelectableRow({ label, index, selectedIndex, selectKey, testId }: SelectableRowProps) {
  const palette = usePalette()
  const store = useStore()
  const isSelected = index === selectedIndex
  const onPress = () => {
    if (isSelected) {
      store.press(selectKey)
      return
    }
    const steps = index - (selectedIndex ?? 0)
    store.pressRepeated(steps > 0 ? 'down' : 'up', Math.abs(steps))
  }
  return (
    <Pressable
      testId={testId}
      onPress={onPress}
      hoverBackground={withAlpha(palette.text, 0.06)}
      style={{
        gap: 10,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 5,
        paddingBottom: 5,
        backgroundColor: isSelected ? withAlpha(palette.keyAction, 0.16) : undefined,
        borderWidth: 1,
        borderColor: isSelected ? withAlpha(palette.keyAction, 0.6) : '#00000000',
      }}
    >
      <Txt color={isSelected ? palette.keyAction : palette.textSecondary} size={12} weight={700} mono wrap={false}>
        {isSelected ? '▶' : ' '}
      </Txt>
      <Txt color={isSelected ? palette.title : palette.text} size={14} weight={isSelected ? 700 : 400} wrap={false}>
        {label}
      </Txt>
    </Pressable>
  )
}
