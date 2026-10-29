import { useWindowSize } from '@gpuix/react'
import { useRef } from 'react'

import { FONTS, usePalette, withAlpha } from '../theme'
import { Card, KeyHint, Modal, Row, Txt, useStore } from '../ui/kit'
import { TabBar } from '../ui/tabs'
import { ScreenFrame } from '../ui/screen-frame'
import type { StyledLine } from '../view-models'

export type HelpView = {
  sections: string[]
  sectionIndex: number
  scrollPosition: number
  totalLines: number
  /** Rows the engine's own viewport shows; scrolling stops at `totalLines - viewportHeight`. */
  viewportHeight: number
  /** Lines from `scrollPosition` on, at most 150. */
  lines: StyledLine[]
  /** Project URL shown when the browser could not be opened. */
  githubFallback: string | null
  starMessage: { url: string; text: string }
}

/** Top bar, frame padding, tab strip, gap, card border and padding, hint bar. */
const HELP_CHROME_HEIGHT = 52 + 48 + 41 + 18 + 2 + 24 + 50
const ENGINE_VIEWPORT_ROWS = 35

/**
 * The engine stops scrolling once its own viewport shows the last line, so the
 * GUI must show at least `viewportHeight` rows or the tail becomes unreachable.
 */
function useContentMetrics(viewportHeight: number) {
  const { height } = useWindowSize()
  const rows = viewportHeight > 0 ? viewportHeight : ENGINE_VIEWPORT_ROWS
  const lineHeight = Math.max(13, Math.min(22, Math.floor((height - HELP_CHROME_HEIGHT) / rows)))
  return { lineHeight, fontSize: Math.round(lineHeight / 1.35) }
}

export function HelpScreen({ view }: { view: HelpView }) {
  const palette = usePalette()
  const store = useStore()
  const pendingPixels = useRef(0)
  const metrics = useContentMetrics(view.viewportHeight)

  // GPUI wheel deltas are negative when scrolling down.
  const onScroll = (event: { deltaY?: number; precise?: boolean }) => {
    const deltaY = event.deltaY ?? 0
    let lines: number
    if (event.precise) {
      pendingPixels.current += deltaY
      lines = Math.trunc(pendingPixels.current / metrics.lineHeight)
      pendingPixels.current -= lines * metrics.lineHeight
    } else {
      lines = Math.round(deltaY)
    }
    if (lines !== 0) store.pressRepeated(lines < 0 ? 'down' : 'up', Math.abs(lines))
  }

  return (
    <>
      <ScreenFrame
        title="Help"
        trailing={<StarMessage starMessage={view.starMessage} />}
        maxWidth={1080}
        hints={
          <>
            <KeyHint keyLabel="← / H" label="Previous tab" sendKey="left" color={palette.keyNavigation} testId="help-left" />
            <KeyHint keyLabel="→ / L" label="Next tab" sendKey="right" color={palette.keyNavigation} testId="help-right" />
            <KeyHint keyLabel="↑ / K" label="Scroll up" sendKey="up" color={palette.keyNavigation} testId="help-up" />
            <KeyHint keyLabel="↓ / J" label="Scroll down" sendKey="down" color={palette.keyNavigation} testId="help-down" />
            <div style={{ flexGrow: 1 }} />
            <KeyHint keyLabel="G" label="GitHub" sendKey="g" color={palette.keyAction} testId="help-github" />
            <KeyHint keyLabel="ESC" label="Close" sendKey="escape" color={palette.keyBack} testId="help-close" />
          </>
        }
      >
        <Row>
          <TabBar tabs={view.sections} selectedIndex={view.sectionIndex} testIdPrefix="help-tab" />
        </Row>

        <Card grow padding={0} testId="help-content">
          <div
            onScroll={onScroll}
            style={{ display: 'flex', flexDirection: 'row', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                minWidth: 0,
                overflow: 'hidden',
                paddingLeft: 22,
                paddingRight: 12,
                paddingTop: 12,
                paddingBottom: 12,
              }}
            >
              {view.lines.map((line, row) => (
                <HelpLine key={`${view.sectionIndex}-${view.scrollPosition + row}`} line={line} {...metrics} />
              ))}
            </div>
            <ScrollIndicator view={view} />
          </div>
        </Card>
      </ScreenFrame>
      {view.githubFallback ? <GithubFallback url={view.githubFallback} /> : null}
    </>
  )
}

/** One help line; long lines wrap like the terminal paragraph does. */
function HelpLine({ line, lineHeight, fontSize }: { line: StyledLine; lineHeight: number; fontSize: number }) {
  const palette = usePalette()
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        minHeight: lineHeight,
        flexShrink: 0,
      }}
    >
      {line.map((run, i) => (
        <text
          key={i}
          style={{
            color: run.fg ?? palette.text,
            backgroundColor: run.bg ?? undefined,
            fontFamily: FONTS.mono,
            fontSize,
            fontWeight: run.bold ? 700 : 400,
            lineHeight,
            whiteSpace: line.length === 1 ? 'normal' : 'nowrap',
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          {run.text}
        </text>
      ))}
    </div>
  )
}

function ScrollIndicator({ view }: { view: HelpView }) {
  const palette = usePalette()
  const maxScroll = Math.max(0, view.totalLines - view.viewportHeight)
  if (maxScroll === 0) return null
  const thumbPercent = Math.max(8, (view.viewportHeight / view.totalLines) * 100)
  const abovePercent = (Math.min(view.scrollPosition, maxScroll) / maxScroll) * (100 - thumbPercent)
  const belowPercent = 100 - thumbPercent - abovePercent
  return (
    <div
      testId="help-scrollbar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 6,
        marginTop: 12,
        marginBottom: 12,
        marginRight: 10,
        borderRadius: 3,
        backgroundColor: withAlpha(palette.text, 0.08),
        flexShrink: 0,
      }}
    >
      <div style={{ flexGrow: abovePercent, flexBasis: 0 }} />
      <div
        style={{
          flexGrow: thumbPercent,
          flexBasis: 0,
          borderRadius: 3,
          backgroundColor: withAlpha(palette.keyNavigation, 0.7),
        }}
      />
      <div style={{ flexGrow: belowPercent, flexBasis: 0 }} />
    </div>
  )
}

function StarMessage({ starMessage }: { starMessage: HelpView['starMessage'] }) {
  const palette = usePalette()
  return (
    <Row gap={6}>
      <Txt color={palette.warning} size={12} wrap={false}>
        ★
      </Txt>
      <Txt color={palette.text} size={12} wrap={false}>
        Star us on GitHub
      </Txt>
      <Txt color={palette.muted} size={12} weight={600} wrap={false}>
        {starMessage.url}
      </Txt>
      <Txt color={palette.text} size={12} wrap={false}>
        {starMessage.text}
      </Txt>
    </Row>
  )
}

function GithubFallback({ url }: { url: string }) {
  const palette = usePalette()
  return (
    <Modal width={520}>
      <Txt color={palette.warning} size={18} weight={700}>
        Cannot open GitHub
      </Txt>
      <Txt color={palette.text} size={14}>
        Please copy and paste the URL below:
      </Txt>
      <div
        style={{
          padding: 12,
          borderRadius: 10,
          backgroundColor: palette.background,
          borderWidth: 1,
          borderColor: withAlpha(palette.border, 0.6),
        }}
      >
        <Txt testId="help-fallback-url" color={palette.info} size={14} weight={600} mono>
          {url}
        </Txt>
      </div>
      <Row justify="flex-end">
        <KeyHint keyLabel="ESC" label="Back" sendKey="escape" color={palette.keyBack} testId="help-fallback-back" />
      </Row>
    </Modal>
  )
}
