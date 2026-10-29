/**
 * Shapes of the JSON each gittype screen returns from `Screen::view_model`
 * (crates/gittype/src/presentation/tui/screens). Rust is the source of truth.
 */

import type { AnimationView } from './screens/animation-screen'
import type { LoadingView } from './screens/loading-screen'
import type { SessionFailureView } from './screens/session-failure-screen'
import type { StageSummaryView } from './screens/stage-summary-screen'
import type { HelpView } from './screens/help-screen'
import type { InfoDialogView } from './screens/info-dialog-screen'
import type { SettingsView } from './screens/settings-screen'
import type { RecordsView } from './screens/records-screen'
import type { SessionDetailView } from './screens/session-detail-screen'
import type { AnalyticsView } from './screens/analytics-screen'
import type { RepoListView } from './screens/repo-list-screen'
import type { RepoPlayView } from './screens/repo-play-screen'
import type { TrendingLanguageSelectionView } from './screens/trending-language-selection-screen'
import type { TrendingRepositorySelectionView } from './screens/trending-repository-selection-screen'

export const PALETTE_ROLES = [
  'border',
  'title',
  'text',
  'textSecondary',
  'background',
  'backgroundSecondary',
  'success',
  'info',
  'error',
  'warning',
  'keyAction',
  'keyNavigation',
  'keyBack',
  'score',
  'cpmWpm',
  'accuracy',
  'duration',
  'stageInfo',
  'typedText',
  'currentCursor',
  'cursorBg',
  'mistakeBg',
  'untypedText',
  'countdown3',
  'countdown2',
  'countdown1',
  'countdownGo',
  'tierBeginner',
  'tierIntermediate',
  'tierAdvanced',
  'tierExpert',
  'tierLegendary',
] as const

export type PaletteRole = (typeof PALETTE_ROLES)[number]

/** `null` means the theme uses the terminal default for that role. */
export type RawPalette = Record<PaletteRole, string | null>

/** A run of styled text, converted from a ratatui `Span`. */
export type StyledRun = { text: string; fg: string | null; bg: string | null; bold: boolean }
export type StyledLine = StyledRun[]

export type RepositoryInfo = {
  user: string
  name: string
  remoteUrl: string
  branch: string | null
  commit: string | null
  dirty: boolean
}

export type TitleView = {
  subtitle: string
  difficulties: { name: string; description: string; subtitle: string; challengeCount: number }[]
  selectedDifficulty: number
  error: string | null
  repository: RepositoryInfo | null
}

export type CodeRunKind = 'typed' | 'cursor' | 'mistake' | 'untyped' | 'comment'

export type TypingView = {
  state: 'waiting' | 'countdown' | 'typing'
  /** 3, 2, 1, then 0 for "GO". */
  countdown: number | null
  dialogShown: boolean
  header: { title: string; language: string | null; difficulty: string } | null
  metrics: {
    wpm: number
    cpm: number
    accuracy: number
    mistakes: number
    streak: number
    timeSecs: number
    skipsRemaining: number
  }
  progress: number
  code: {
    startLine: number
    /** Index of `lines[0]` within the whole challenge. */
    firstLineIndex: number
    totalLines: number
    currentLine: number
    lines: { kind: CodeRunKind; text: string }[][]
    preContext: { number: number; text: string }[]
    postContext: { number: number; text: string }[]
  }
}

export type ScreenViews = {
  Title: TitleView
  Typing: TypingView
  Loading: LoadingView
  /** `null` until the stage result is available. */
  StageSummary: StageSummaryView | null
  SessionFailure: SessionFailureView
  /** `null` until the session result is injected. */
  Animation: AnimationView | null
  Settings: SettingsView
  Help: HelpView
  InfoDialog: InfoDialogView
  Records: RecordsView
  SessionDetail: SessionDetailView
  Analytics: AnalyticsView
  RepoList: RepoListView
  RepoPlay: RepoPlayView
  TrendingLanguageSelection: TrendingLanguageSelectionView
  TrendingRepositorySelection: TrendingRepositorySelectionView
}

export type ScreenName =
  | 'Title'
  | 'Loading'
  | 'Typing'
  | 'StageSummary'
  | 'SessionSummary'
  | 'TotalSummary'
  | 'TotalSummaryShare'
  | 'SessionFailure'
  | 'Records'
  | 'Analytics'
  | 'SessionDetail'
  | 'SessionSharing'
  | 'Animation'
  | 'VersionCheck'
  | 'InfoDialog'
  | 'Help'
  | 'DetailsDialog'
  | 'Settings'
  | 'Panic'
  | 'RepoList'
  | 'RepoPlay'
  | 'TrendingLanguageSelection'
  | 'TrendingRepositorySelection'

export type Snapshot = {
  screen: ScreenName
  stack: ScreenName[]
  exitRequested: boolean
  palette: RawPalette
  view: unknown
  /** `handle_game_error` lines once repository processing has failed. */
  loadingFailure: string[] | null
}

export function viewOf<S extends keyof ScreenViews>(snapshot: Snapshot, screen: S): ScreenViews[S] {
  // SAFETY: GameEngine.snapshot pairs `view` with the `screen` it came from,
  // and each Rust view_model emits exactly the ScreenViews[screen] shape.
  // Verified by: test/game-flow.e2e.test.ts
  return snapshot.view as ScreenViews[S]
}
