import { usePalette, withAlpha } from '../theme'
import { Column, KeyHint, Pressable, Row, Txt, useStore } from '../ui/kit'
import { RepositoryChip } from '../ui/repository-chip'
import { ScreenFrame, Wordmark } from '../ui/screen-frame'
import type { TitleView } from '../view-models'

export function TitleScreen({ view }: { view: TitleView }) {
  const palette = usePalette()
  const store = useStore()
  const selected = view.difficulties[view.selectedDifficulty]

  // The screen only knows ←/→; clicking a card walks the selection there.
  const selectDifficulty = (index: number) => {
    const steps = index - view.selectedDifficulty
    if (steps !== 0) store.pressRepeated(steps > 0 ? 'right' : 'left', Math.abs(steps))
  }

  return (
    <ScreenFrame
      title="Code Typing Challenge"
      trailing={<RepositoryChip repository={view.repository} />}
      centered
      maxWidth={940}
      hints={
        <>
          <KeyHint keyLabel="←→ / HL" label="Change Difficulty" color={palette.keyNavigation} />
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="R" label="Records" sendKey="r" color={palette.info} testId="title-records" />
          <KeyHint keyLabel="A" label="Analytics" sendKey="a" color={palette.info} testId="title-analytics" />
          <KeyHint keyLabel="S" label="Settings" sendKey="s" color={palette.info} testId="title-settings" />
          <KeyHint keyLabel="I / ?" label="Help" sendKey="i" color={palette.info} testId="title-help" />
          <KeyHint keyLabel="ESC" label="Quit" sendKey="escape" color={palette.error} testId="title-quit" />
        </>
      }
    >
      <Column align="center" gap={10}>
        <Wordmark size={64} />
        <Txt color={palette.textSecondary} size={16}>
          {view.subtitle}
        </Txt>
      </Column>

      <Row gap={12} justify="center">
        {view.difficulties.map((difficulty, index) => {
          const isSelected = index === view.selectedDifficulty
          return (
            <Pressable
              key={difficulty.name}
              testId={`difficulty-${difficulty.name.toLowerCase()}`}
              onPress={() => selectDifficulty(index)}
              hoverBackground={withAlpha(palette.keyAction, 0.1)}
              style={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                width: 170,
                padding: 16,
                borderRadius: 14,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? palette.keyAction : withAlpha(palette.border, 0.5),
                backgroundColor: isSelected ? withAlpha(palette.keyAction, 0.12) : palette.backgroundSecondary,
              }}
            >
              <Txt color={isSelected ? palette.title : palette.text} size={17} weight={700}>
                {difficulty.name}
              </Txt>
              <Txt color={palette.info} size={12}>
                {difficulty.challengeCount > 0 ? `${difficulty.challengeCount} challenges` : '—'}
              </Txt>
            </Pressable>
          )
        })}
      </Row>

      <Column align="center" gap={6}>
        {view.error ? (
          <Txt testId="title-error" color={palette.error} size={14} weight={700} align="center">
            {view.error}
          </Txt>
        ) : selected ? (
          <>
            <Txt color={palette.text} size={14} align="center">
              {selected.description}
            </Txt>
            <Txt color={palette.textSecondary} size={13} align="center">
              {selected.subtitle}
            </Txt>
            <Txt color={palette.info} size={12} align="center">
              {selected.challengeCount > 0
                ? `${selected.challengeCount} challenges available`
                : 'Challenge count will be displayed after loading'}
            </Txt>
          </>
        ) : null}
      </Column>

      <Row justify="center">
        <Pressable
          testId="title-start"
          onPress={() => store.press('space')}
          hoverBackground={withAlpha(palette.success, 0.85)}
          style={{
            gap: 10,
            paddingLeft: 28,
            paddingRight: 28,
            paddingTop: 12,
            paddingBottom: 12,
            borderRadius: 12,
            backgroundColor: palette.success,
          }}
        >
          <Txt color={palette.background} size={16} weight={800} wrap={false}>
            Start
          </Txt>
          <Txt color={withAlpha(palette.background, 0.7)} size={12} weight={700} mono wrap={false}>
            SPACE
          </Txt>
        </Pressable>
      </Row>
    </ScreenFrame>
  )
}
