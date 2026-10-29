import { usePalette, withAlpha } from '../theme'
import { Card, Column, ProgressBar, Row, Txt } from '../ui/kit'
import { RepositoryChip } from '../ui/repository-chip'
import { ScreenFrame, Wordmark } from '../ui/screen-frame'
import type { RepositoryInfo } from '../view-models'

type StepStatus = 'done' | 'current' | 'pending'

export type LoadingView = {
  message: string
  description: string
  currentStep: string
  steps: {
    type: string
    number: number
    name: string
    description: string
    status: StepStatus
    progress: { processed: number; total: number; ratio: number } | null
  }[]
  spinner: string
  /** The line under the step list; `null` when gittype draws none. */
  progress: {
    ratio: number
    processed: number
    total: number
    unit: string
    showBar: boolean
    text: string
  } | null
  /** gittype's preformatted repository line (with emoji); prefer `repository`. */
  repoInfo: string | null
  repository: RepositoryInfo | null
  failed: boolean
  error: string | null
}

function StepIcon({ status }: { status: StepStatus }) {
  const palette = usePalette()
  const color = status === 'done' ? palette.success : status === 'current' ? palette.warning : palette.textSecondary
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: withAlpha(color, status === 'pending' ? 0.08 : 0.18),
        borderWidth: 1,
        borderColor: withAlpha(color, 0.6),
        flexShrink: 0,
      }}
    >
      <Txt color={color} size={12} weight={700} wrap={false}>
        {status === 'done' ? '✓' : status === 'current' ? '●' : '○'}
      </Txt>
    </div>
  )
}

export function LoadingScreen({ view }: { view: LoadingView }) {
  const palette = usePalette()
  return (
    <ScreenFrame title="Loading" trailing={<RepositoryChip repository={view.repository} />} centered maxWidth={620}>
      <Column align="center" gap={8}>
        <Wordmark size={40} />
        <Row gap={10}>
          <Txt color={palette.warning} size={20} weight={700} mono wrap={false} testId="loading-spinner">
            {view.spinner}
          </Txt>
          <Txt color={palette.warning} size={20} weight={700} wrap={false}>
            {view.message}
          </Txt>
        </Row>
        <Txt color={palette.textSecondary} size={14} align="center">
          {view.description}
        </Txt>
      </Column>

      <Card padding={22} testId="loading-steps">
        <Column gap={12}>
          {view.steps.map((step) => (
            <Row key={step.type} gap={12}>
              <StepIcon status={step.status} />
              <Txt
                color={step.status === 'pending' ? palette.textSecondary : palette.text}
                size={14}
                weight={step.status === 'current' ? 700 : 400}
                wrap={false}
              >
                {step.description}
              </Txt>
            </Row>
          ))}
        </Column>
      </Card>

      {view.progress ? (
        <Column gap={8}>
          {view.progress.showBar ? <ProgressBar percent={view.progress.ratio * 100} color={palette.success} /> : null}
          <Txt color={palette.success} size={13} mono align="center" wrap={false} testId="loading-progress">
            {view.progress.text}
          </Txt>
        </Column>
      ) : null}

      {view.failed && view.error ? (
        <Txt color={palette.error} size={13} weight={600} align="center" testId="loading-error">
          {view.error}
        </Txt>
      ) : null}
    </ScreenFrame>
  )
}
