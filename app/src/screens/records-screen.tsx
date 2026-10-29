import { useWindowSize } from '@gpuix/react'

import { usePalette } from '../theme'
import { Badge, Card, Column, KeyHint, Row, Txt, useStore } from '../ui/kit'
import { Cell, ListRow, mutedColor, selectListRow, useScrollWindow } from '../ui/group-c-widgets'
import { ScreenFrame } from '../ui/screen-frame'

export type RecordRow = {
  id: number
  date: string
  repository: string
  score: string
  cpm: string
  accuracy: string
  stages: string
  duration: string
}

export type RecordsView = {
  title: string
  filter: string
  sort: string
  sortDescending: boolean
  sessionCount: number
  sessions: RecordRow[]
  selectedIndex: number | null
  scrollOffset: number
  emptyMessage: string[]
}

const ROW_HEIGHT = 36
/** Top bar, hint bar, frame padding, card padding and the column header. */
const CHROME_HEIGHT = 52 + 50 + 48 + 40 + 44

const COLUMNS = { date: 150, score: 70, cpm: 70, accuracy: 80, stages: 64, duration: 80 }

function HeaderRow() {
  const palette = usePalette()
  const color = mutedColor(palette)
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 12, paddingLeft: 13, paddingRight: 13 }}>
      <Cell width={COLUMNS.date} color={color} mono={false} weight={700}>
        DATE
      </Cell>
      <Cell grow color={color} mono={false} weight={700}>
        REPOSITORY
      </Cell>
      <Cell width={COLUMNS.score} align="right" color={color} mono={false} weight={700}>
        SCORE
      </Cell>
      <Cell width={COLUMNS.cpm} align="right" color={color} mono={false} weight={700}>
        CPM
      </Cell>
      <Cell width={COLUMNS.accuracy} align="right" color={color} mono={false} weight={700}>
        ACC
      </Cell>
      <Cell width={COLUMNS.stages} align="right" color={color} mono={false} weight={700}>
        STAGES
      </Cell>
      <Cell width={COLUMNS.duration} align="right" color={color} mono={false} weight={700}>
        TIME
      </Cell>
    </div>
  )
}

function SessionRow({ row, index, view }: { row: RecordRow; index: number; view: RecordsView }) {
  const palette = usePalette()
  const store = useStore()
  const selected = index === view.selectedIndex
  return (
    <ListRow
      selected={selected}
      height={ROW_HEIGHT}
      testId={`records-row-${index}`}
      onPress={() => selectListRow(store, view.selectedIndex, index, 'enter')}
    >
      <Cell width={COLUMNS.date} color={mutedColor(palette)}>
        {row.date}
      </Cell>
      <Cell grow color={selected ? palette.title : palette.text} mono={false} weight={selected ? 700 : 500}>
        {row.repository}
      </Cell>
      <Cell width={COLUMNS.score} align="right" color={palette.score}>
        {row.score}
      </Cell>
      <Cell width={COLUMNS.cpm} align="right" color={palette.cpmWpm}>
        {row.cpm}
      </Cell>
      <Cell width={COLUMNS.accuracy} align="right" color={palette.accuracy}>
        {row.accuracy}
      </Cell>
      <Cell width={COLUMNS.stages} align="right" color={palette.stageInfo}>
        {row.stages}
      </Cell>
      <Cell width={COLUMNS.duration} align="right" color={palette.duration}>
        {row.duration}
      </Cell>
    </ListRow>
  )
}

function EmptyRecords({ lines }: { lines: string[] }) {
  const palette = usePalette()
  return (
    <Column align="center" justify="center" grow gap={8}>
      {lines.map((line, i) => (
        <Txt key={i} color={i === 0 ? palette.text : mutedColor(palette)} size={i === 0 ? 16 : 14} align="center">
          {line}
        </Txt>
      ))}
    </Column>
  )
}

export function RecordsScreen({ view }: { view: RecordsView }) {
  const palette = usePalette()
  const windowSize = useWindowSize()
  const visibleRows = Math.max(3, Math.floor((windowSize.height - CHROME_HEIGHT) / ROW_HEIGHT))
  const start = useScrollWindow(view.selectedIndex, view.sessions.length, visibleRows)
  const visible = view.sessions.slice(start, start + visibleRows)
  const hasSelection = view.selectedIndex !== null && view.sessions.length > 0

  return (
    <ScreenFrame
      title={view.title}
      trailing={
        <Row gap={8}>
          <Badge color={palette.border}>{`Filter: ${view.filter}`}</Badge>
          <Badge color={palette.info}>{`Sort: ${view.sort} ${view.sortDescending ? '↓' : '↑'}`}</Badge>
          <Badge color={mutedColor(palette)}>{`Sessions: ${view.sessionCount}`}</Badge>
        </Row>
      }
      hints={
        <>
          <KeyHint keyLabel="↑ / k" label="Up" sendKey="up" color={palette.keyNavigation} testId="records-up" />
          <KeyHint keyLabel="↓ / j" label="Down" sendKey="down" color={palette.keyNavigation} testId="records-down" />
          <KeyHint
            keyLabel="SPACE / ENTER"
            label="Details"
            sendKey="space"
            color={palette.keyAction}
            disabled={!hasSelection}
            testId="records-details"
          />
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="f" label="Filter" sendKey="f" color={palette.border} testId="records-filter" />
          <KeyHint keyLabel="s" label="Sort" sendKey="s" color={palette.info} testId="records-sort" />
          <KeyHint keyLabel="r" label="Refresh" sendKey="r" color={palette.warning} testId="records-refresh" />
          <KeyHint keyLabel="ESC" label="Back" sendKey="escape" color={palette.error} testId="records-back" />
        </>
      }
    >
      <Card grow padding={20} testId="records-list">
        {view.sessions.length === 0 ? (
          <EmptyRecords lines={view.emptyMessage} />
        ) : (
          <>
            <HeaderRow />
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
              {visible.map((row, i) => (
                <SessionRow key={row.id} row={row} index={start + i} view={view} />
              ))}
            </div>
            {view.sessions.length > visibleRows ? (
              <Txt color={mutedColor(palette)} size={12} align="right">
                {`${start + 1}-${start + visible.length} of ${view.sessions.length}`}
              </Txt>
            ) : null}
          </>
        )}
      </Card>
    </ScreenFrame>
  )
}
