import { usePalette } from '../theme'
import { Card, Column, KeyHint, Row, Stat, Txt } from '../ui/kit'
import { RepositoryChip } from '../ui/repository-chip'
import { ScreenFrame } from '../ui/screen-frame'
import type { RepositoryInfo } from '../view-models'

export type SessionFailureView = {
  title: string
  stagesCompleted: number
  totalStages: number
  stagesText: string
  metrics: { cpm: string; wpm: string; time: string; keystrokes: number; mistakes: number; accuracy: string }
  message: string
  repository: RepositoryInfo | null
}

export function SessionFailureScreen({ view }: { view: SessionFailureView }) {
  const palette = usePalette()
  return (
    <ScreenFrame
      title="Session Failed"
      trailing={<RepositoryChip repository={view.repository} />}
      centered
      maxWidth={760}
      hints={
        <>
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="R" label="Retry" sendKey="r" color={palette.success} testId="failure-retry" />
          <KeyHint keyLabel="T" label="Back to Title" sendKey="t" color={palette.success} testId="failure-title" />
          <KeyHint
            keyLabel="ESC"
            label="Session Summary & Exit"
            sendKey="escape"
            color={palette.error}
            testId="failure-exit"
          />
        </>
      }
    >
      <Column align="center" gap={6}>
        <Txt color={palette.error} size={13} weight={700} wrap={false}>
          {view.title}
        </Txt>
        <Txt color={palette.title} size={30} weight={700}>
          Session failed
        </Txt>
        <Txt color={palette.info} size={15} weight={600} wrap={false} testId="failure-stages">
          {view.stagesText}
        </Txt>
      </Column>

      <Card accent={palette.error} padding={22}>
        <Row justify="space-between" gap={16}>
          <Stat label="CPM" value={view.metrics.cpm} color={palette.cpmWpm} size={22} />
          <Stat label="WPM" value={view.metrics.wpm} color={palette.cpmWpm} size={22} />
          <Stat label="TIME" value={view.metrics.time} color={palette.duration} size={22} />
          <Stat label="KEYSTROKES" value={view.metrics.keystrokes} color={palette.stageInfo} size={22} />
          <Stat label="MISTAKES" value={view.metrics.mistakes} color={palette.error} size={22} />
          <Stat label="ACCURACY" value={view.metrics.accuracy} color={palette.accuracy} size={22} />
        </Row>
      </Card>

      <Txt color={palette.error} size={15} align="center">
        {view.message}
      </Txt>
    </ScreenFrame>
  )
}
