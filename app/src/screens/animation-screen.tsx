import { FONTS, usePalette } from '../theme'
import { Column, KeyHint, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'

export type AnimationView = {
  phase: 'lines' | 'pause' | 'complete'
  rankName: string
  tier: string
  currentLine: number
  lines: { text: string; visibleText: string; color: string | null; completed: boolean; showCursor: boolean }[]
  pauseDots: number
  skipHint: string
}

const LINE_FONT_SIZE = 17
const LINE_HEIGHT = 28

export function AnimationScreen({ view }: { view: AnimationView | null }) {
  const palette = usePalette()
  return (
    <ScreenFrame
      title="Calculating your rank"
      centered
      maxWidth={900}
      hints={
        <>
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="S" label="Skip" sendKey="s" color={palette.muted} testId="animation-skip" />
        </>
      }
    >
      {!view || view.phase === 'complete' ? null : (
        <Column align="center" gap={10}>
          {view.lines.map((line, i) => (
            <div
              key={i}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: LINE_HEIGHT }}
            >
              <text
                style={{
                  color: line.color ?? palette.text,
                  fontFamily: FONTS.mono,
                  fontSize: LINE_FONT_SIZE,
                  whiteSpace: 'nowrap',
                }}
              >
                {line.visibleText}
              </text>
              {line.showCursor ? (
                <div style={{ width: 10, height: LINE_FONT_SIZE + 4, marginLeft: 2, backgroundColor: palette.text }} />
              ) : null}
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: LINE_HEIGHT }}>
            {view.phase === 'pause' ? (
              <Txt color={palette.muted} size={LINE_FONT_SIZE + 4} mono wrap={false} testId="animation-dots">
                {'.'.repeat(view.pauseDots)}
              </Txt>
            ) : null}
          </div>
        </Column>
      )}
    </ScreenFrame>
  )
}
