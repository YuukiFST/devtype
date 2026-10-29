import type { ReactNode } from 'react'

import { FONTS, usePalette, withAlpha } from '../theme'
import { Txt } from './kit'

export function Wordmark({ size = 18 }: { size?: number }) {
  const palette = usePalette()
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end' }}>
      <text style={{ color: palette.title, fontSize: size, fontWeight: 800, fontFamily: FONTS.mono }}>dev</text>
      <text style={{ color: palette.keyAction, fontSize: size, fontWeight: 800, fontFamily: FONTS.mono }}>type</text>
    </div>
  )
}

type ScreenFrameProps = {
  title: string
  /** Right side of the top bar: repository, filters, counters. */
  trailing?: ReactNode
  /** Key hints shown in the bottom bar. */
  hints?: ReactNode
  children: ReactNode
  /** Center the content block instead of filling the window. */
  centered?: boolean
  maxWidth?: number
}

/** Window chrome shared by every screen: top bar, content, key-hint bar. */
export function ScreenFrame({ title, trailing, hints, children, centered, maxWidth = 1120 }: ScreenFrameProps) {
  const palette = usePalette()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          height: 52,
          paddingLeft: 22,
          paddingRight: 22,
          borderBottomWidth: 1,
          borderColor: withAlpha(palette.border, 0.35),
          flexShrink: 0,
        }}
      >
        <Wordmark />
        <div style={{ width: 1, height: 18, backgroundColor: withAlpha(palette.border, 0.6) }} />
        <Txt color={palette.muted} size={14} weight={600} wrap={false}>
          {title}
        </Txt>
        <div style={{ flexGrow: 1 }} />
        {trailing}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          minHeight: 0,
          alignItems: 'center',
          justifyContent: centered ? 'center' : 'flex-start',
          paddingLeft: 28,
          paddingRight: 28,
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth,
            flexGrow: centered ? 0 : 1,
            minHeight: 0,
            gap: 18,
          }}
        >
          {children}
        </div>
      </div>
      {hints ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6,
            minHeight: 50,
            paddingLeft: 16,
            paddingRight: 16,
            borderTopWidth: 1,
            borderColor: withAlpha(palette.border, 0.35),
            backgroundColor: withAlpha(palette.backgroundSecondary, 0.6),
            flexShrink: 0,
          }}
        >
          {hints}
        </div>
      ) : null}
    </div>
  )
}
