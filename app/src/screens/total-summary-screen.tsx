import { usePalette } from '../theme'
import { Card, Column, KeyHint, Row, Stat, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'
import type { TotalSummaryView } from '../view-models'

export type { TotalSummaryView }

function SessionExtreme({ label, cpm, accuracy, testId }: { label: string; cpm: string; accuracy: string; testId: string }) {
  const palette = usePalette()
  return (
    <Card title={label} grow testId={testId}>
      <Row gap={18}>
        <Txt color={palette.cpmWpm} size={20} weight={700} mono wrap={false}>
          {cpm}
        </Txt>
        <Txt color={palette.accuracy} size={20} weight={700} mono wrap={false}>
          {accuracy}
        </Txt>
      </Row>
    </Card>
  )
}

export function TotalSummaryScreen({ view }: { view: TotalSummaryView }) {
  const palette = usePalette()
  const { overall, totals } = view

  return (
    <ScreenFrame
      title="Total Summary"
      centered
      maxWidth={960}
      hints={
        <>
          <KeyHint keyLabel="S" label="Share Result" sendKey="s" color={palette.success} testId="total-share" />
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="ESC" label="Exit" sendKey="escape" color={palette.error} testId="total-exit" />
        </>
      }
    >
      <Card accent={palette.score} testId="total-score">
        <Column align="center" gap={8}>
          <Txt color={palette.score} size={13} weight={800}>
            TOTAL SCORE
          </Txt>
          <Column gap={0} align="center">
            {view.score.art.map((line, row) => (
              <Txt key={row} color={palette.score} size={14} weight={700} mono wrap={false}>
                {line}
              </Txt>
            ))}
          </Column>
        </Column>
      </Card>

      <Card title="OVERALL" testId="total-overall">
        <Row gap={28} justify="space-between">
          <Stat label="CPM" value={overall.cpm} color={palette.cpmWpm} testId="total-cpm" />
          <Stat label="WPM" value={overall.wpm} color={palette.cpmWpm} testId="total-wpm" />
          <Stat label="ACCURACY" value={overall.accuracy} color={palette.accuracy} testId="total-accuracy" />
        </Row>
      </Card>

      <Card title="TOTALS" testId="total-totals">
        <Row gap={24} justify="space-between">
          <Stat label="SESSIONS" value={totals.sessions} color={palette.stageInfo} size={22} />
          <Stat label="COMPLETED" value={totals.completed} color={palette.success} size={22} />
          <Stat label="STAGES" value={totals.stages} color={palette.stageInfo} size={22} />
          <Stat label="KEYSTROKES" value={totals.keystrokes} color={palette.stageInfo} size={22} />
          <Stat label="MISTAKES" value={totals.mistakes} color={palette.error} size={22} />
          <Stat label="SKIPPED" value={totals.skipped} color={palette.warning} size={22} />
        </Row>
      </Card>

      <Row gap={18} align="stretch">
        <SessionExtreme label="BEST SESSION" {...view.bestSession} testId="total-best" />
        <SessionExtreme label="WORST SESSION" {...view.worstSession} testId="total-worst" />
      </Row>

      <Column align="center" gap={4}>
        <Txt testId="total-thanks" color={palette.success} size={16} weight={800} align="center">
          {view.thanks}
        </Txt>
        <Txt testId="total-star" color={palette.warning} size={14} align="center">
          {view.star}
        </Txt>
      </Column>
    </ScreenFrame>
  )
}
