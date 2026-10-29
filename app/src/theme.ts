import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createContext, useContext } from 'react'

import { PALETTE_ROLES, type PaletteRole, type RawPalette } from './view-models'

export type Palette = Record<PaletteRole, string>

/** Roles a theme leaves at the terminal default get these instead. */
const DEFAULT_ROLE_COLORS: Palette = {
  border: '#3a3f4b',
  title: '#e6e6e6',
  text: '#d4d4d4',
  textSecondary: '#8a8f98',
  background: '#121417',
  backgroundSecondary: '#1b1e23',
  success: '#50fa7b',
  info: '#8be9fd',
  error: '#ff5555',
  warning: '#f1fa8c',
  keyAction: '#bd93f9',
  keyNavigation: '#8be9fd',
  keyBack: '#ff79c6',
  score: '#ffb86c',
  cpmWpm: '#50fa7b',
  accuracy: '#f1fa8c',
  duration: '#8be9fd',
  stageInfo: '#bd93f9',
  typedText: '#50fa7b',
  currentCursor: '#121417',
  cursorBg: '#d4d4d4',
  mistakeBg: '#ff5555',
  untypedText: '#6b7280',
  countdown3: '#50fa7b',
  countdown2: '#8be9fd',
  countdown1: '#f1fa8c',
  countdownGo: '#ff5555',
  tierBeginner: '#5fafff',
  tierIntermediate: '#00d7ff',
  tierAdvanced: '#5faf87',
  tierExpert: '#ffaf00',
  tierLegendary: '#d75f5f',
}

export function resolvePalette(raw: RawPalette): Palette {
  const palette = { ...DEFAULT_ROLE_COLORS }
  for (const role of PALETTE_ROLES) {
    const color = raw[role]
    if (color) palette[role] = color
  }
  return palette
}

/** `#rrggbb` plus an alpha channel, for tints of a theme color. */
export function withAlpha(hex: string, alpha: number): string {
  const channel = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
  return `${hex.slice(0, 7)}${channel.toString(16).padStart(2, '0')}`
}

function firstInstalledFont(candidates: [family: string, file: string][], fallback: string): string {
  const fontsDir = join(process.env.WINDIR ?? 'C:\\Windows', 'Fonts')
  for (const [family, file] of candidates) {
    if (existsSync(join(fontsDir, file))) return family
  }
  return fallback
}

// GPUI takes one family name per text node, so pick an installed one up front.
export const FONTS = {
  ui: process.platform === 'win32' ? 'Segoe UI' : 'Inter',
  mono:
    process.platform === 'win32'
      ? firstInstalledFont(
          [
            ['Cascadia Mono', 'CascadiaMono.ttf'],
            ['Cascadia Code', 'CascadiaCode.ttf'],
          ],
          'Consolas',
        )
      : 'Menlo',
}

export const ThemeContext = createContext<Palette>(DEFAULT_ROLE_COLORS)

export function usePalette(): Palette {
  return useContext(ThemeContext)
}
