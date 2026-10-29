import { usePalette, withAlpha } from '../theme'
import { Badge, Card, KeyHint, Row, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'
import type { BestRecordRow, DetailsDialogView } from '../view-models'

export type { DetailsDialogView }

function BestRecord({ row }: { row: BestRecordRow }) {
  const palette = usePalette()
  return (
    <Row gap={14}>
      <div style={{ width: 120 }}>
        <Txt color={palette.text} size={14} weight={600} wrap={false}>
          {row.label}
        </Txt>
      </div>
      {row.hasRecord ? (
        <>
          {row.newPb ? <Badge color={palette.warning}>NEW PB!</Badge> : null}
          <Txt color={palette.score} size={14} mono wrap={false}>{`Score ${row.score}`}</Txt>
          <Txt color={palette.cpmWpm} size={14} mono wrap={false}>{`CPM ${row.cpm}`}</Txt>
          <Txt color={palette.accuracy} size={14} mono wrap={false}>{`Acc ${row.accuracy}`}</Txt>
          {row.diffText ? (
            <Txt color={row.diff > 0 ? palette.success : palette.error} size={14} weight={700} mono wrap={false}>
              {row.diffText}
            </Txt>
          ) : null}
        </>
      ) : (
        <Txt color={palette.textSecondary} size={14}>
          No previous record
        </Txt>
      )}
    </Row>
  )
}

export function DetailsDialogScreen({ view }: { view: DetailsDialogView }) {
  const palette = usePalette()
  return (
    <ScreenFrame
      title="Session Details"
      maxWidth={860}
      hints={
        <>
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="ESC" label="Return" sendKey="escape" color={palette.error} testId="details-return" />
        </>
      }
    >
      {view.bestRecords ? (
        <Card title="BEST RECORDS" accent={palette.warning} testId="details-best-records">
          {view.bestRecords.map((row) => (
            <BestRecord key={row.label} row={row} />
          ))}
        </Card>
      ) : null}
      <Card grow testId="details-stages">
        <Txt color={palette.info} size={14} weight={700}>
          {view.stageResultsLabel}
        </Txt>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'scroll', minHeight: 0, flexGrow: 1 }}>
          {view.stages.map((stage, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: 12,
                borderRadius: 10,
                backgroundColor: withAlpha(palette.text, 0.04),
                flexShrink: 0,
              }}
            >
              <Txt color={palette.text} size={14} weight={700} mono wrap={false}>
                {stage.name}
              </Txt>
              <Row gap={18}>
                <Txt color={palette.score} size={13} mono wrap={false}>{`Score: ${stage.score}`}</Txt>
                <Txt color={palette.cpmWpm} size={13} mono wrap={false}>{`CPM: ${stage.cpm}`}</Txt>
                <Txt color={palette.accuracy} size={13} mono wrap={false}>{`Acc: ${stage.accuracy}`}</Txt>
              </Row>
            </div>
          ))}
        </div>
      </Card>
    </ScreenFrame>
  )
}
