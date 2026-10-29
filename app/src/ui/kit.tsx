import { createContext, useContext, type ReactNode } from 'react'

import type { EngineStore } from '../engine-store'
import { FONTS, usePalette, withAlpha } from '../theme'
import type { StyledLine } from '../view-models'

export const StoreContext = createContext<EngineStore | null>(null)

export function useStore(): EngineStore {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore needs a StoreContext provider')
  return store
}

type TextProps = {
  children: ReactNode
  color?: string
  size?: number
  weight?: number
  mono?: boolean
  align?: 'left' | 'center' | 'right'
  wrap?: boolean
  testId?: string
}

/** Every <text> needs an explicit color: GPUI paints uncolored text black. */
export function Txt({ children, color, size = 14, weight = 400, mono, align, wrap = true, testId }: TextProps) {
  const palette = usePalette()
  return (
    <text
      testId={testId}
      style={{
        color: color ?? palette.text,
        fontSize: size,
        fontWeight: weight,
        fontFamily: mono ? FONTS.mono : FONTS.ui,
        textAlign: align,
        whiteSpace: wrap ? 'normal' : 'nowrap',
      }}
    >
      {children}
    </text>
  )
}

type PressableProps = {
  onPress: () => void
  children: ReactNode
  testId?: string
  disabled?: boolean
  style?: Record<string, unknown>
  hoverBackground?: string
}

/**
 * A clickable surface that never takes keyboard focus, so typing keeps
 * flowing to the window-level key handler after a click.
 */
export function Pressable({ onPress, children, testId, disabled, style, hoverBackground }: PressableProps) {
  const palette = usePalette()
  return (
    <div
      testId={testId}
      onClick={disabled ? undefined : onPress}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        borderRadius: 8,
        ...style,
        hover: disabled ? undefined : { backgroundColor: hoverBackground ?? withAlpha(palette.text, 0.08) },
      }}
    >
      {children}
    </div>
  )
}

/** Keyboard key cap, e.g. `SPACE` or `←→`. */
export function KeyCap({ label, color }: { label: string; color?: string }) {
  const palette = usePalette()
  const tone = color ?? palette.textSecondary
  return (
    <div
      style={{
        paddingLeft: 7,
        paddingRight: 7,
        paddingTop: 2,
        paddingBottom: 2,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: withAlpha(tone, 0.55),
        backgroundColor: withAlpha(tone, 0.12),
      }}
    >
      <Txt color={tone} size={11} weight={700} mono wrap={false}>
        {label}
      </Txt>
    </div>
  )
}

type KeyHintProps = {
  keyLabel: string
  label: string
  /** Key sent to the engine when the hint is clicked. */
  sendKey?: string
  color?: string
  disabled?: boolean
  testId?: string
}

/** A key cap plus its action; clicking it sends the same key press. */
export function KeyHint({ keyLabel, label, sendKey, color, disabled, testId }: KeyHintProps) {
  const store = useStore()
  const palette = usePalette()
  const content = (
    <>
      <KeyCap label={keyLabel} color={color} />
      <Txt color={palette.text} size={13} wrap={false}>
        {label}
      </Txt>
    </>
  )
  if (!sendKey) {
    return <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>{content}</div>
  }
  return (
    <Pressable
      testId={testId}
      disabled={disabled}
      onPress={() => store.press(sendKey)}
      style={{ gap: 8, paddingLeft: 8, paddingRight: 10, paddingTop: 6, paddingBottom: 6 }}
    >
      {content}
    </Pressable>
  )
}

export function Card({
  children,
  title,
  accent,
  grow,
  padding = 20,
  testId,
}: {
  children: ReactNode
  title?: string
  accent?: string
  grow?: boolean
  padding?: number
  testId?: string
}) {
  const palette = usePalette()
  return (
    <div
      testId={testId}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding,
        borderRadius: 14,
        backgroundColor: palette.backgroundSecondary,
        borderWidth: 1,
        borderColor: withAlpha(accent ?? palette.border, 0.45),
        flexGrow: grow ? 1 : 0,
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {title ? <SectionLabel color={accent}>{title}</SectionLabel> : null}
      {children}
    </div>
  )
}

export function SectionLabel({ children, color }: { children: ReactNode; color?: string }) {
  const palette = usePalette()
  return (
    <Txt color={color ?? palette.textSecondary} size={11} weight={700} wrap={false}>
      {children}
    </Txt>
  )
}

export function Stat({
  label,
  value,
  color,
  size = 26,
  testId,
}: {
  label: string
  value: string | number
  color?: string
  size?: number
  testId?: string
}) {
  const palette = usePalette()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <SectionLabel>{label}</SectionLabel>
      <Txt testId={testId} color={color ?? palette.text} size={size} weight={700} mono wrap={false}>
        {String(value)}
      </Txt>
    </div>
  )
}

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  const palette = usePalette()
  const tone = color ?? palette.info
  return (
    <div
      style={{
        paddingLeft: 9,
        paddingRight: 9,
        paddingTop: 3,
        paddingBottom: 3,
        borderRadius: 999,
        backgroundColor: withAlpha(tone, 0.14),
        borderWidth: 1,
        borderColor: withAlpha(tone, 0.4),
      }}
    >
      <Txt color={tone} size={12} weight={600} wrap={false}>
        {children}
      </Txt>
    </div>
  )
}

export function ProgressBar({ percent, color, height = 8 }: { percent: number; color?: string; height?: number }) {
  const palette = usePalette()
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div
      style={{
        height,
        borderRadius: height,
        backgroundColor: withAlpha(palette.text, 0.08),
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div style={{ height, width: `${clamped}%`, borderRadius: height, backgroundColor: color ?? palette.success }} />
    </div>
  )
}

export function Row({
  children,
  gap = 12,
  align = 'center',
  justify,
  wrap,
  grow,
}: {
  children: ReactNode
  gap?: number
  align?: 'center' | 'flex-start' | 'flex-end' | 'stretch'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
  wrap?: boolean
  grow?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        flexGrow: grow ? 1 : 0,
        minWidth: 0,
      }}
    >
      {children}
    </div>
  )
}

export function Column({
  children,
  gap = 12,
  align,
  grow,
  justify,
}: {
  children: ReactNode
  gap?: number
  align?: 'center' | 'flex-start' | 'flex-end' | 'stretch'
  grow?: boolean
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        alignItems: align,
        justifyContent: justify,
        flexGrow: grow ? 1 : 0,
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {children}
    </div>
  )
}

/** Renders ratatui-styled lines (ASCII art, rank titles) in monospace. */
export function StyledLines({ lines, size = 13, fallback }: { lines: StyledLine[]; size?: number; fallback?: string }) {
  const palette = usePalette()
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {lines.map((line, row) => (
        <div key={row} style={{ display: 'flex', flexDirection: 'row', height: Math.round(size * 1.3) }}>
          {line.map((run, i) => (
            <text
              key={i}
              style={{
                color: run.fg ?? fallback ?? palette.text,
                backgroundColor: run.bg ?? undefined,
                fontFamily: FONTS.mono,
                fontSize: size,
                fontWeight: run.bold ? 700 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {run.text}
            </text>
          ))}
        </div>
      ))}
    </div>
  )
}

/** A dimmed backdrop with a centered panel, for dialogs over a screen. */
export function Modal({ children, width = 440 }: { children: ReactNode; width?: number }) {
  const palette = usePalette()
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: withAlpha(palette.background, 0.78),
      }}
    >
      <div
        style={{
          width,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: 24,
          borderRadius: 16,
          backgroundColor: palette.backgroundSecondary,
          borderWidth: 1,
          borderColor: withAlpha(palette.border, 0.7),
          boxShadow: { offsetX: 0, offsetY: 18, blurRadius: 48, spreadRadius: 0, color: '#00000088' },
        }}
      >
        {children}
      </div>
    </div>
  )
}
