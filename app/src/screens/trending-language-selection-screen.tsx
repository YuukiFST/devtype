import { usePalette } from '../theme'
import { Card, KeyHint, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'
import { SelectionList } from './selection-list'

export type TrendingLanguageSelectionView = {
  /** Display names in list order. */
  languages: string[]
  selected: number | null
}

export function TrendingLanguageSelectionScreen({ view }: { view: TrendingLanguageSelectionView }) {
  const palette = usePalette()
  return (
    <ScreenFrame
      title="Trending Languages"
      maxWidth={640}
      hints={
        <>
          <KeyHint keyLabel="↑↓ / JK" label="Navigate" color={palette.keyNavigation} />
          <KeyHint
            keyLabel="SPACE"
            label="Select"
            sendKey="space"
            color={palette.keyAction}
            testId="trending-language-select"
          />
          <div style={{ flexGrow: 1 }} />
          <KeyHint
            keyLabel="ESC"
            label="Return"
            sendKey="escape"
            color={palette.keyBack}
            testId="trending-language-return"
          />
        </>
      }
    >
      <Txt color={palette.title} size={20} weight={700}>
        Select Programming Language
      </Txt>
      <Card title="PROGRAMMING LANGUAGES" grow>
        <SelectionList
          items={view.languages}
          selected={view.selected}
          confirmKey="space"
          testIdPrefix="trending-language-row"
          renderRow={(language, index) => (
            <>
              <div style={{ width: 28, flexShrink: 0 }}>
                <Txt color={palette.muted} size={13} mono wrap={false}>
                  {`${String(index + 1).padStart(2, ' ')}.`}
                </Txt>
              </div>
              <Txt color={palette.text} size={15} weight={700} wrap={false}>
                {language}
              </Txt>
            </>
          )}
        />
      </Card>
    </ScreenFrame>
  )
}
