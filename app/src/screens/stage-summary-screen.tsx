import { FONTS, usePalette, withAlpha } from '../theme'
import { Card, Column, KeyHint, Row, Stat, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'
import type { StyledLine } from '../view-models'

export type StageSummaryView = {
  outcome: 'completed' | 'failed' | 'skipped'
  title: string
  stageNumber: number
  totalStages: number
  hasNextStage: boolean
  progressText: string
  nextText: string | null
  scoreLabel: string
  /** Score, seconds before failing, or `---` when skipped. */
  scoreValue: string
  /** gittype's ASCII-digit rendering of `scoreValue`, tier gradient applied. */
  scoreAscii: StyledLine[]
  /** Rank-tier gradient stops for the score. */
  scoreGradient: string[]
  outcomeColor: string | null
  showMetrics: boolean
  metrics: { cpm: string; wpm: string; time: string; keystrokes: number; mistakes: number; accuracy: string }
}

function outcomeLabel(outcome: StageSummaryView['outcome']): string {
  if (outcome === 'failed') return 'Stage failed'
  if (outcome === 'skipped') return 'Stage skipped'
  return 'Stage complete'
}

export function StageSummaryScreen({ view }: { view: StageSummaryView | null }) {
  const palette = usePalette()
  if (!view) return <ScreenFrame title="Stage Summary">{null}</ScreenFrame>
  const accent = view.outcomeColor ?? palette.success
  // Completed scores take the rank-tier gradient across their digits, as gittype's ASCII digits do.
  const scoreColors = view.outcome === 'completed' && view.scoreGradient.length > 0 ? view.scoreGradient : [accent]
  const scoreChars = Array.from(view.outcome === 'failed' ? `${view.scoreValue}s` : view.scoreValue)

  return (
    <ScreenFrame
      title={`Stage ${view.stageNumber} of ${view.totalStages}`}
      centered
      maxWidth={760}
      hints={
        <>
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="SPACE" label="Continue" sendKey="space" color={palette.success} testId="stage-continue" />
          <KeyHint keyLabel="ESC" label="Quit" sendKey="escape" color={palette.error} testId="stage-quit" />
        </>
      }
    >
      <Column align="center" gap={6}>
        <Txt color={accent} size={13} weight={700} wrap={false} testId="stage-title">
          {view.title}
        </Txt>
        <Txt color={palette.title} size={28} weight={700}>
          {outcomeLabel(view.outcome)}
        </Txt>
      </Column>

      <Card accent={accent} padding={28}>
        <Column align="center" gap={4}>
          <Txt color={accent} size={13} weight={700} wrap={false}>
            {view.scoreLabel}
          </Txt>
          <Row gap={0} justify="center">
            {scoreChars.map((ch, i) => (
              <text
                key={i}
                testId={i === 0 ? 'stage-score' : undefined}
                style={{
                  color: scoreColors[Math.floor((i * scoreColors.length) / scoreChars.length)],
                  fontSize: 84,
                  fontWeight: 900,
                  fontFamily: FONTS.mono,
                  whiteSpace: 'nowrap',
                }}
              >
                {ch}
              </text>
            ))}
          </Row>
        </Column>
      </Card>

      {view.showMetrics ? (
        <Card padding={20}>
          <Row justify="space-between" gap={16}>
            <Stat label="CPM" value={view.metrics.cpm} color={palette.cpmWpm} size={22} />
            <Stat label="WPM" value={view.metrics.wpm} color={palette.cpmWpm} size={22} />
            <Stat label="TIME" value={view.metrics.time} color={palette.duration} size={22} />
            <Stat label="KEYSTROKES" value={view.metrics.keystrokes} color={palette.stageInfo} size={22} />
            <Stat label="MISTAKES" value={view.metrics.mistakes} color={palette.error} size={22} />
            <Stat label="ACCURACY" value={view.metrics.accuracy} color={palette.accuracy} size={22} />
          </Row>
        </Card>
      ) : null}

      <Column align="center" gap={8}>
        <Row gap={6}>
          {Array.from({ length: view.totalStages }, (_, i) => (
            <div
              key={i}
              style={{
                width: 36,
                height: 6,
                borderRadius: 3,
                backgroundColor: i < view.stageNumber ? accent : withAlpha(palette.text, 0.12),
              }}
            />
          ))}
        </Row>
        <Txt color={palette.text} size={14} wrap={false} testId="stage-progress">
          {view.progressText}
        </Txt>
        {view.nextText ? (
          <Txt color={palette.warning} size={13} wrap={false}>
            {view.nextText}
          </Txt>
        ) : null}
      </Column>
    </ScreenFrame>
  )
}
