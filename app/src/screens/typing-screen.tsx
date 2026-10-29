import { useWindowSize } from '@gpuix/react'

import { FONTS, usePalette, withAlpha, type Palette } from '../theme'
import { Badge, Card, Column, KeyHint, Modal, ProgressBar, Row, Stat, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'
import type { TypingView } from '../view-models'
import { buildCodeRows, centeredWindowStart, type CodeRow, type RowRunKind } from './code-rows'

const CODE_FONT_SIZE = 16
const CODE_LINE_HEIGHT = 26
/** Monospace advance as a fraction of the font size (Cascadia/Consolas ≈ 0.55-0.6). */
const CODE_CHAR_WIDTH_RATIO = 0.6
const GUTTER_WIDTH = 64
/** Height taken by the top bar, hint bar, header card, metrics and gaps. */
const CHROME_HEIGHT = 380
const CONTENT_MAX_WIDTH = 1120

function runStyle(kind: RowRunKind, palette: Palette): { color: string; backgroundColor?: string } {
  switch (kind) {
    case 'typed':
      return { color: palette.typedText }
    case 'cursor':
      return { color: palette.currentCursor, backgroundColor: palette.cursorBg }
    case 'mistake':
      return { color: palette.currentCursor, backgroundColor: palette.mistakeBg }
    case 'untyped':
      return { color: palette.untypedText }
    case 'comment':
    case 'context':
      return { color: palette.muted }
  }
}

function CodeRowView({ row, palette }: { row: CodeRow; palette: Palette }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: CODE_LINE_HEIGHT, alignItems: 'center' }}>
      <div style={{ width: GUTTER_WIDTH, flexShrink: 0, display: 'flex', justifyContent: 'flex-end', paddingRight: 16 }}>
        <text
          style={{
            color: row.isCurrentLine ? palette.warning : withAlpha(palette.textSecondary, 0.7),
            fontWeight: row.isCurrentLine ? 700 : 400,
            fontFamily: FONTS.mono,
            fontSize: CODE_FONT_SIZE - 2,
            whiteSpace: 'nowrap',
          }}
        >
          {row.number === null ? '' : String(row.number)}
        </text>
      </div>
      {row.runs.map((run, i) => (
        <text
          key={i}
          style={{
            ...runStyle(run.kind, palette),
            fontFamily: FONTS.mono,
            fontSize: CODE_FONT_SIZE,
            whiteSpace: 'nowrap',
          }}
        >
          {run.text}
        </text>
      ))}
    </div>
  )
}

function CodePanel({ view }: { view: TypingView }) {
  const palette = usePalette()
  const windowSize = useWindowSize()
  const panelWidth = Math.min(windowSize.width - 56, CONTENT_MAX_WIDTH) - 48 - GUTTER_WIDTH
  const columns = Math.floor(panelWidth / (CODE_FONT_SIZE * CODE_CHAR_WIDTH_RATIO))
  const visibleRows = Math.max(4, Math.floor((windowSize.height - CHROME_HEIGHT) / CODE_LINE_HEIGHT))

  const showCode = view.state === 'typing'
  const rows = showCode ? buildCodeRows(view.code, columns) : []
  const start = centeredWindowStart(rows, visibleRows)
  const visible = rows.slice(start, start + visibleRows)

  return (
    <Card title="CODE" accent={palette.keyAction} grow padding={22} testId="typing-code">
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
        {visible.map((row, i) => (
          <CodeRowView key={start + i} row={row} palette={palette} />
        ))}
      </div>
    </Card>
  )
}

function StartPrompt() {
  const palette = usePalette()
  return (
    <Column align="center" gap={14}>
      <Txt color={palette.text} size={22} weight={600}>
        Ready when you are
      </Txt>
      <Row gap={10}>
        <Txt color={palette.muted} size={15}>
          Press
        </Txt>
        <KeyHint keyLabel="SPACE" label="to start" sendKey="space" color={palette.success} testId="typing-start" />
      </Row>
    </Column>
  )
}

function Countdown({ count }: { count: number }) {
  const palette = usePalette()
  const color =
    count === 3 ? palette.countdown3 : count === 2 ? palette.countdown2 : count === 1 ? palette.countdown1 : palette.countdownGo
  return (
    <text
      testId="typing-countdown"
      style={{ color, fontSize: 132, fontWeight: 900, fontFamily: FONTS.mono, whiteSpace: 'nowrap' }}
    >
      {count === 0 ? 'GO!' : String(count)}
    </text>
  )
}

function OptionsDialog({ skipsRemaining }: { skipsRemaining: number }) {
  const palette = usePalette()
  return (
    <Modal width={420}>
      <Txt color={palette.warning} size={18} weight={700}>
        Game Options
      </Txt>
      <Txt color={palette.text} size={14} weight={600}>
        Choose an option:
      </Txt>
      <Column gap={4}>
        <KeyHint
          keyLabel="S"
          label={skipsRemaining > 0 ? `Skip challenge (${skipsRemaining})` : 'No skips remaining'}
          sendKey="s"
          disabled={skipsRemaining === 0}
          color={skipsRemaining > 0 ? palette.info : palette.muted}
          testId="dialog-skip"
        />
        <KeyHint keyLabel="Q" label="Quit (fail)" sendKey="q" color={palette.error} testId="dialog-quit" />
        <KeyHint keyLabel="ESC" label="Back to game" sendKey="escape" color={palette.keyAction} testId="dialog-back" />
      </Column>
    </Modal>
  )
}

export function TypingScreen({ view }: { view: TypingView }) {
  const palette = usePalette()
  const { metrics } = view

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ScreenFrame
        title="Challenge"
        hints={<KeyHint keyLabel="ESC" label="Options" sendKey="escape" color={palette.keyAction} testId="typing-options" />}
      >
        <Card padding={16}>
          <Row gap={10}>
            <Txt color={palette.text} size={15} weight={600} wrap={false}>
              {view.header?.title ?? '[Challenge]'}
            </Txt>
            <div style={{ flexGrow: 1 }} />
            {view.header?.language ? <Badge color={palette.info}>{view.header.language}</Badge> : null}
            {view.header ? <Badge color={palette.muted}>{view.header.difficulty}</Badge> : null}
          </Row>
        </Card>

        <CodePanel view={view} />

        <Card padding={16}>
          <Row justify="space-between" gap={18}>
            <Stat label="WPM" value={metrics.wpm} color={palette.cpmWpm} testId="metric-wpm" />
            <Stat label="CPM" value={metrics.cpm} color={palette.cpmWpm} testId="metric-cpm" />
            <Stat label="ACCURACY" value={`${metrics.accuracy}%`} color={palette.accuracy} testId="metric-accuracy" />
            <Stat label="MISTAKES" value={metrics.mistakes} color={palette.error} testId="metric-mistakes" />
            <Stat label="STREAK" value={metrics.streak} color={palette.stageInfo} />
            <Stat label="TIME" value={`${metrics.timeSecs}s`} color={palette.duration} />
            <Stat label="SKIPS" value={metrics.skipsRemaining} color={palette.muted} />
          </Row>
          <Row gap={12}>
            <ProgressBar percent={view.progress} color={palette.typedText} />
            <Txt color={palette.muted} size={12} mono wrap={false} testId="typing-progress">
              {`${view.progress}%`}
            </Txt>
          </Row>
        </Card>
      </ScreenFrame>

      {view.state !== 'typing' ? (
        <div
          style={{
            position: 'absolute',
            top: 140,
            left: 0,
            right: 0,
            bottom: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: view.state === 'waiting' ? 'auto' : 'none',
          }}
        >
          {view.state === 'waiting' ? <StartPrompt /> : <Countdown count={view.countdown ?? 0} />}
        </div>
      ) : null}

      {view.dialogShown ? <OptionsDialog skipsRemaining={metrics.skipsRemaining} /> : null}
    </div>
  )
}
