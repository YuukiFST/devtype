import { usePalette } from '../theme'
import { Badge, Card, Column, KeyHint, Row, Stat, StyledLines, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'
import type { SessionSummaryView } from '../view-models'

export type { SessionSummaryView }

export function SessionSummaryScreen({ view }: { view: SessionSummaryView }) {
  const palette = usePalette()
  const { rank, score, metrics } = view
  const rankColor = rank.color ?? palette.title
  const diffColor = score.diff > 0 ? palette.success : score.diff < 0 ? palette.error : palette.text

  return (
    <ScreenFrame
      title="Session Complete"
      centered
      maxWidth={1040}
      hints={
        <>
          <KeyHint keyLabel="D" label="Show Detail" sendKey="d" color={palette.info} testId="summary-detail" />
          <KeyHint keyLabel="S" label="Share Result" sendKey="s" color={palette.info} testId="summary-share" />
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="R" label="Retry" sendKey="r" color={palette.success} testId="summary-retry" />
          <KeyHint keyLabel="T" label="Back to Title" sendKey="t" color={palette.success} testId="summary-title" />
          <KeyHint keyLabel="ESC" label="Quit" sendKey="escape" color={palette.error} testId="summary-quit" />
        </>
      }
    >
      <Card accent={rankColor} testId="summary-rank">
        <Column align="center" gap={10}>
          <Txt color={palette.muted} size={13} weight={700}>
            {"YOU'RE:"}
          </Txt>
          <StyledLines lines={rank.art} size={13} fallback={rankColor} />
          <Row gap={10} justify="center">
            <Txt testId="summary-rank-name" color={rankColor} size={20} weight={800} wrap={false}>
              {rank.name}
            </Txt>
            <Badge color={rankColor}>{rank.tierInfo}</Badge>
          </Row>
        </Column>
      </Card>

      <Row gap={18} align="stretch">
        <Card accent={palette.score} grow testId="summary-score">
          <Column align="center" gap={8}>
            <Txt color={palette.score} size={13} weight={800}>
              SESSION SCORE
            </Txt>
            {score.bestLabel ? (
              <Txt testId="summary-best" color={palette.warning} size={14} weight={800}>
                {score.bestLabel}
              </Txt>
            ) : null}
            <StyledLines lines={score.art} size={13} fallback={palette.score} />
            <Txt testId="summary-diff" color={diffColor} size={16} weight={800}>
              {score.diffText}
            </Txt>
          </Column>
        </Card>
        <Card grow title="METRICS" testId="summary-metrics">
          <Row gap={28} justify="space-between">
            <Stat label="CPM" value={metrics.cpm} color={palette.cpmWpm} testId="summary-cpm" />
            <Stat label="WPM" value={metrics.wpm} color={palette.cpmWpm} testId="summary-wpm" />
            <Stat label="TIME" value={metrics.time} color={palette.duration} testId="summary-time" />
          </Row>
          <Row gap={28} justify="space-between">
            <Stat label="KEYSTROKES" value={metrics.keystrokes} color={palette.stageInfo} testId="summary-keystrokes" />
            <Stat label="MISTAKES" value={metrics.mistakes} color={palette.error} testId="summary-mistakes" />
            <Stat label="ACCURACY" value={metrics.accuracy} color={palette.accuracy} testId="summary-accuracy" />
          </Row>
        </Card>
      </Row>
    </ScreenFrame>
  )
}
