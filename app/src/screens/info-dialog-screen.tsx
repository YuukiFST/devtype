import { usePalette, withAlpha } from '../theme'
import { Column, KeyHint, Modal, Pressable, Row, Txt, useStore } from '../ui/kit'

export type InfoDialogView = {
  title: string
  options: string[]
  selectedOption: number
  /** Set after a link failed to open in the browser. */
  fallback: { title: string; url: string } | null
}

export function InfoDialogScreen({ view }: { view: InfoDialogView }) {
  if (view.fallback) return <InfoDialogFallback fallback={view.fallback} />
  return <InfoDialogMenu view={view} />
}

function InfoDialogMenu({ view }: { view: InfoDialogView }) {
  const palette = usePalette()
  const store = useStore()

  // The menu wraps around, but a click only needs the shortest straight walk.
  const selectOption = (index: number) => {
    if (index === view.selectedOption) {
      store.press('space')
      return
    }
    const steps = index - view.selectedOption
    store.pressRepeated(steps > 0 ? 'down' : 'up', Math.abs(steps))
  }

  return (
    <Modal width={500}>
      <Txt color={palette.title} size={18} weight={700} align="center">
        {view.title}
      </Txt>
      <Column gap={4}>
        {view.options.map((option, index) => {
          const isSelected = index === view.selectedOption
          return (
            <Pressable
              key={option}
              testId={`info-option-${index}`}
              onPress={() => selectOption(index)}
              hoverBackground={withAlpha(palette.warning, 0.1)}
              style={{
                gap: 10,
                paddingLeft: 14,
                paddingRight: 14,
                paddingTop: 9,
                paddingBottom: 9,
                borderWidth: 1,
                borderColor: isSelected ? withAlpha(palette.warning, 0.6) : '#00000000',
                backgroundColor: isSelected ? withAlpha(palette.warning, 0.12) : undefined,
              }}
            >
              <Txt color={palette.warning} size={12} weight={700} mono wrap={false}>
                {isSelected ? '▶' : ' '}
              </Txt>
              <Txt color={isSelected ? palette.warning : palette.text} size={15} weight={isSelected ? 700 : 400} wrap={false}>
                {option}
              </Txt>
            </Pressable>
          )
        })}
      </Column>
      <Row gap={4} justify="center" wrap>
        <KeyHint keyLabel="↑ / K" label="Up" sendKey="up" color={palette.keyNavigation} testId="info-up" />
        <KeyHint keyLabel="↓ / J" label="Down" sendKey="down" color={palette.keyNavigation} testId="info-down" />
        <KeyHint keyLabel="SPACE" label="Select" sendKey="space" color={palette.keyAction} testId="info-select" />
        <KeyHint keyLabel="ESC" label="Close" sendKey="escape" color={palette.keyBack} testId="info-close" />
      </Row>
    </Modal>
  )
}

function InfoDialogFallback({ fallback }: { fallback: NonNullable<InfoDialogView['fallback']> }) {
  const palette = usePalette()
  return (
    <Modal width={520}>
      <Txt color={palette.warning} size={18} weight={700}>
        {fallback.title}
      </Txt>
      <Txt color={palette.text} size={14}>
        Please copy and paste the URL below:
      </Txt>
      <div
        style={{
          padding: 12,
          borderRadius: 10,
          backgroundColor: palette.background,
          borderWidth: 1,
          borderColor: withAlpha(palette.border, 0.6),
        }}
      >
        <Txt testId="info-fallback-url" color={palette.info} size={14} weight={600} mono>
          {fallback.url}
        </Txt>
      </div>
      <Row justify="flex-end">
        <KeyHint keyLabel="ESC" label="Back" sendKey="escape" color={palette.keyBack} testId="info-fallback-back" />
      </Row>
    </Modal>
  )
}
