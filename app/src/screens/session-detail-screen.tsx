import { useWindowSize } from '@gpuix/react'

import { usePalette, withAlpha, type Palette } from '../theme'
import { Badge, Card, Column, KeyHint, Row, Stat, Txt } from '../ui/kit'
import { MetricLine, mutedColor } from '../ui/group-c-widgets'
import { ScreenFrame } from '../ui/screen-frame'

export type StageStatus = 'COMPLETED' | 'SKIPPED' | 'FAILED'

export type SessionStageView = {
  number: number
  status: StageStatus
  /** `path:start-end`, only when the stage stored its source range. */
  file: string | null
  score: string
  cpm: string
  wpm: string
  keystrokes: number
  mistakes: number
  accuracy: string
  duration: string
}

export type SessionDetailView = {
  session: { repository: string | null; started: string; branch: string | null; commit: string | null }
  performance: {
    tierRank: string
    score: string
    cpm: string
    wpm: string
    accuracy: string
    duration: string
    stagesCompleted: number
    stagesAttempted: number
    stagesSkipped: number
  } | null
  stages: SessionStageView[]
  stageScrollOffset: number
}

const STAGE_HEIGHT = 92
const STAGE_GAP = 10
/** Top bar, hint bar, frame padding, top cards, stage card padding and title. */
const CHROME_HEIGHT = 52 + 50 + 48 + 206 + 18 + 40 + 24

function statusColor(status: StageStatus, palette: Palette): string {
  if (status === 'FAILED') return palette.error
  if (status === 'SKIPPED') return palette.warning
  return palette.success
}

function SessionCard({ session }: { session: SessionDetailView['session'] }) {
  const palette = usePalette()
  return (
    <Card title="SESSION" grow testId="session-detail-session">
      <Column gap={2}>
        {session.repository ? <MetricLine label="Repository" value={session.repository} color={palette.info} /> : null}
        <MetricLine label="Started" value={session.started} color={palette.duration} />
        {session.branch ? <MetricLine label="Branch" value={session.branch} color={palette.stageInfo} /> : null}
        {session.commit ? <MetricLine label="Commit" value={session.commit} color={mutedColor(palette)} /> : null}
      </Column>
    </Card>
  )
}

function PerformanceCard({ performance }: { performance: SessionDetailView['performance'] }) {
  const palette = usePalette()
  if (!performance) {
    return (
      <Card title="PERFORMANCE" grow testId="session-detail-performance">
        <Txt color={mutedColor(palette)} size={14}>
          No performance data available
        </Txt>
      </Card>
    )
  }
  return (
    <Card title="PERFORMANCE" grow testId="session-detail-performance">
      <Row gap={8}>
        <Txt color={mutedColor(palette)} size={13} wrap={false}>
          Tier/Rank
        </Txt>
        <Badge color={palette.keyAction}>{performance.tierRank}</Badge>
      </Row>
      <Row justify="space-between" gap={14}>
        <Stat label="SCORE" value={performance.score} color={palette.score} size={20} />
        <Stat label="CPM" value={performance.cpm} color={palette.cpmWpm} size={20} />
        <Stat label="WPM" value={performance.wpm} color={palette.cpmWpm} size={20} />
        <Stat label="ACCURACY" value={performance.accuracy} color={palette.accuracy} size={20} />
        <Stat label="DURATION" value={performance.duration} color={palette.duration} size={20} />
      </Row>
      <Row gap={8}>
        <Badge color={palette.stageInfo}>
          {`Completed Stage: ${performance.stagesCompleted}/${performance.stagesAttempted}`}
        </Badge>
        {performance.stagesSkipped > 0 ? (
          <Badge color={palette.warning}>{`Skipped: ${performance.stagesSkipped}`}</Badge>
        ) : null}
      </Row>
    </Card>
  )
}

function StageMetric({ label, value, color }: { label: string; value: string | number; color: string }) {
  const palette = usePalette()
  return (
    <Column gap={1}>
      <Txt color={mutedColor(palette)} size={11} weight={700} wrap={false}>
        {label}
      </Txt>
      <Txt color={color} size={14} weight={600} mono wrap={false}>
        {String(value)}
      </Txt>
    </Column>
  )
}

function StageRow({ stage }: { stage: SessionStageView }) {
  const palette = usePalette()
  const tone = statusColor(stage.status, palette)
  return (
    <div
      testId={`session-detail-stage-${stage.number}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: STAGE_HEIGHT,
        flexShrink: 0,
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 10,
        paddingBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: withAlpha(tone, 0.35),
        backgroundColor: withAlpha(tone, 0.05),
      }}
    >
      <Row gap={10}>
        <Txt color={palette.info} size={14} weight={700} wrap={false}>
          {`Stage #${stage.number}`}
        </Txt>
        <Badge color={tone}>{stage.status}</Badge>
        <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
          {stage.file ? (
            <Txt color={mutedColor(palette)} size={12} mono wrap={false}>
              {stage.file}
            </Txt>
          ) : null}
        </div>
      </Row>
      <Row justify="space-between" gap={12}>
        <StageMetric label="SCORE" value={stage.score} color={palette.score} />
        <StageMetric label="CPM" value={stage.cpm} color={palette.cpmWpm} />
        <StageMetric label="WPM" value={stage.wpm} color={palette.cpmWpm} />
        <StageMetric label="KEYSTROKES" value={stage.keystrokes} color={palette.stageInfo} />
        <StageMetric label="MISTAKES" value={stage.mistakes} color={palette.error} />
        <StageMetric label="ACCURACY" value={stage.accuracy} color={palette.accuracy} />
        <StageMetric label="DURATION" value={stage.duration} color={palette.duration} />
      </Row>
    </div>
  )
}

function StagesCard({ view }: { view: SessionDetailView }) {
  const palette = usePalette()
  const windowSize = useWindowSize()
  const fit = Math.max(1, Math.floor((windowSize.height - CHROME_HEIGHT + STAGE_GAP) / (STAGE_HEIGHT + STAGE_GAP)))
  const total = view.stages.length
  const visible = view.stages.slice(view.stageScrollOffset, view.stageScrollOffset + fit)
  const title =
    total > visible.length
      ? `STAGE DETAILS (${visible.length}/${total} STAGES SHOWN, ↑↓ TO SCROLL)`
      : `STAGE DETAILS (${total} STAGES)`

  return (
    <Card title={title} grow testId="session-detail-stages">
      {total === 0 ? (
        <Txt color={mutedColor(palette)} size={14}>
          No stage data available
        </Txt>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: STAGE_GAP, flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
          {visible.map((stage) => (
            <StageRow key={stage.number} stage={stage} />
          ))}
        </div>
      )}
    </Card>
  )
}

export function SessionDetailScreen({ view }: { view: SessionDetailView }) {
  const palette = usePalette()
  const canScrollUp = view.stageScrollOffset > 0
  const canScrollDown = view.stageScrollOffset + 1 < view.stages.length

  return (
    <ScreenFrame
      title="Session Details"
      hints={
        <>
          <KeyHint
            keyLabel="↑"
            label="Scroll Up"
            sendKey="up"
            color={palette.keyNavigation}
            disabled={!canScrollUp}
            testId="session-detail-up"
          />
          <KeyHint
            keyLabel="↓"
            label="Scroll Down"
            sendKey="down"
            color={palette.keyNavigation}
            disabled={!canScrollDown}
            testId="session-detail-down"
          />
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="ESC" label="Back" sendKey="escape" color={palette.error} testId="session-detail-back" />
        </>
      }
    >
      <Row align="stretch" gap={18}>
        <SessionCard session={view.session} />
        <PerformanceCard performance={view.performance} />
      </Row>
      <StagesCard view={view} />
    </ScreenFrame>
  )
}
