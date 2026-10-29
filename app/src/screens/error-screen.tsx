import { HostKeyHint } from '../host/host-keys'
import { usePalette } from '../theme'
import { Card, Column, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'

export type ErrorView = {
  /** gittype's `handle_game_error` output, one entry per line. */
  lines: string[]
}

const LEADING_GLYPH = /^(❌|💡|💥|⚠️)\s*/u

/** The console text without its leading status glyph. */
function plain(line: string): string {
  return line.replace(LEADING_GLYPH, '')
}

export function ErrorScreen({ view }: { view: ErrorView }) {
  const palette = usePalette()
  const [headline = 'Unknown error', ...details] = view.lines
  return (
    <ScreenFrame
      title="Error"
      centered
      maxWidth={760}
      hints={
        <>
          <div style={{ flexGrow: 1 }} />
          <HostKeyHint keyLabel="ESC" label="Exit" sendKey="escape" color={palette.keyBack} testId="error-exit" />
          <div style={{ flexGrow: 1 }} />
        </>
      }
    >
      <Card accent={palette.error} padding={28}>
        <Txt color={palette.error} size={18} weight={700} testId="error-headline">
          {plain(headline)}
        </Txt>
        {details.length > 0 ? (
          <Column gap={6}>
            {details.map((line, i) => (
              <Txt
                key={i}
                color={line.startsWith('💡') ? palette.info : palette.text}
                size={14}
                weight={line.startsWith('💡') ? 600 : 400}
                mono={line.startsWith('   ')}
              >
                {plain(line)}
              </Txt>
            ))}
          </Column>
        ) : null}
      </Card>
    </ScreenFrame>
  )
}
