import { HostKeyHint } from '../host/host-keys'
import { usePalette } from '../theme'
import { Card, Column, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'

export type PanicView = {
  title: string
  apology: string
  sessionNote: string
  logPath: string
  issuesUrl: string
  timestamp: string
  messageLines: string[]
  /** `file:line:column` of the panic, split out of the message. */
  location: string | null
}

export function PanicScreen({ view }: { view: PanicView }) {
  const palette = usePalette()
  return (
    <ScreenFrame
      title="Application Panic"
      maxWidth={900}
      hints={
        <>
          <div style={{ flexGrow: 1 }} />
          <HostKeyHint keyLabel="ESC" label="Exit" sendKey="escape" color={palette.keyBack} testId="panic-exit" />
          <div style={{ flexGrow: 1 }} />
        </>
      }
    >
      <Column align="center" gap={6}>
        <Txt color={palette.error} size={24} weight={800} align="center">
          {view.title}
        </Txt>
        <Txt color={palette.error} size={14} align="center">
          {view.apology}
        </Txt>
        <Txt color={palette.warning} size={14} align="center">
          {view.sessionNote}
        </Txt>
      </Column>

      <Card title="HELP" padding={18}>
        <Column gap={4}>
          <Txt color={palette.success} size={13} weight={700}>
            Logs saved to:
          </Txt>
          <Txt color={palette.text} size={13} mono testId="panic-log-path">
            {view.logPath}
          </Txt>
        </Column>
        <Column gap={4}>
          <Txt color={palette.stageInfo} size={13} weight={700}>
            Report this issue:
          </Txt>
          <Txt color={palette.text} size={13} mono testId="panic-issues-url">
            {view.issuesUrl}
          </Txt>
        </Column>
      </Card>

      <Card title="ERROR DETAILS" grow padding={18}>
        <Column gap={4}>
          <Txt color={palette.info} size={13} weight={700}>
            Time:
          </Txt>
          <Txt color={palette.text} size={13} mono>
            {view.timestamp}
          </Txt>
        </Column>
        <Column gap={4}>
          <Txt color={palette.error} size={13} weight={700}>
            Panic Message:
          </Txt>
          {view.messageLines.map((line, i) => (
            <Txt key={i} color={palette.text} size={13} mono testId={i === 0 ? 'panic-message' : undefined}>
              {line}
            </Txt>
          ))}
        </Column>
        {view.location ? (
          <Column gap={4}>
            <Txt color={palette.info} size={13} weight={700}>
              Location:
            </Txt>
            <Txt color={palette.text} size={13} mono>
              {view.location}
            </Txt>
          </Column>
        ) : null}
      </Card>
    </ScreenFrame>
  )
}
