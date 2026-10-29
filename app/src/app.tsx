import { useMemo } from 'react'

import { useSnapshot, type EngineStore } from './engine-store'
import { HelpScreen } from './screens/help-screen'
import { InfoDialogScreen } from './screens/info-dialog-screen'
import { SettingsScreen } from './screens/settings-screen'
import { RepoListScreen } from './screens/repo-list-screen'
import { RepoPlayScreen } from './screens/repo-play-screen'
import { TitleScreen } from './screens/title-screen'
import { TrendingLanguageSelectionScreen } from './screens/trending-language-selection-screen'
import { TrendingRepositorySelectionScreen } from './screens/trending-repository-selection-screen'
import { TypingScreen } from './screens/typing-screen'
import { AnimationScreen } from './screens/animation-screen'
import { LoadingScreen } from './screens/loading-screen'
import { SessionFailureScreen } from './screens/session-failure-screen'
import { StageSummaryScreen } from './screens/stage-summary-screen'
import { RecordsScreen } from './screens/records-screen'
import { SessionDetailScreen } from './screens/session-detail-screen'
import { AnalyticsScreen } from './screens/analytics-screen'
import { SessionSummaryScreen } from './screens/session-summary-screen'
import { DetailsDialogScreen } from './screens/details-dialog-screen'
import { SessionSharingScreen } from './screens/session-sharing-screen'
import { TotalSummaryScreen } from './screens/total-summary-screen'
import { TotalSummaryShareScreen } from './screens/total-summary-share-screen'
import { resolvePalette, ThemeContext, usePalette } from './theme'
import { KeyHint, StoreContext, Txt } from './ui/kit'
import { ScreenFrame } from './ui/screen-frame'
import { viewOf, type Snapshot } from './view-models'

function UnportedScreen({ snapshot }: { snapshot: Snapshot }) {
  const palette = usePalette()
  return (
    <ScreenFrame
      title={snapshot.screen}
      centered
      hints={<KeyHint keyLabel="ESC" label="Back" sendKey="escape" color={palette.keyBack} />}
    >
      <Txt color={palette.textSecondary} size={15} align="center">
        {`The ${snapshot.screen} screen has no GUI yet.`}
      </Txt>
    </ScreenFrame>
  )
}

function CurrentScreen({ snapshot }: { snapshot: Snapshot }) {
  switch (snapshot.screen) {
    case 'Title':
      return <TitleScreen view={viewOf(snapshot, 'Title')} />
    case 'Typing':
      return <TypingScreen view={viewOf(snapshot, 'Typing')} />
    case 'Loading':
      return <LoadingScreen view={viewOf(snapshot, 'Loading')} />
    case 'StageSummary':
      return <StageSummaryScreen view={viewOf(snapshot, 'StageSummary')} />
    case 'SessionFailure':
      return <SessionFailureScreen view={viewOf(snapshot, 'SessionFailure')} />
    case 'Animation':
      return <AnimationScreen view={viewOf(snapshot, 'Animation')} />
    case 'Settings':
      return <SettingsScreen view={viewOf(snapshot, 'Settings')} />
    case 'Help':
      return <HelpScreen view={viewOf(snapshot, 'Help')} />
    case 'InfoDialog':
      return <InfoDialogScreen view={viewOf(snapshot, 'InfoDialog')} />
    case 'Records':
      return <RecordsScreen view={viewOf(snapshot, 'Records')} />
    case 'SessionDetail':
      return <SessionDetailScreen view={viewOf(snapshot, 'SessionDetail')} />
    case 'Analytics':
      return <AnalyticsScreen view={viewOf(snapshot, 'Analytics')} />
    case 'RepoList':
      return <RepoListScreen view={viewOf(snapshot, 'RepoList')} />
    case 'RepoPlay':
      return <RepoPlayScreen view={viewOf(snapshot, 'RepoPlay')} />
    case 'TrendingLanguageSelection':
      return <TrendingLanguageSelectionScreen view={viewOf(snapshot, 'TrendingLanguageSelection')} />
    case 'TrendingRepositorySelection':
      return <TrendingRepositorySelectionScreen view={viewOf(snapshot, 'TrendingRepositorySelection')} />
    case 'SessionSummary':
      return <SessionSummaryScreen view={viewOf(snapshot, 'SessionSummary')} />
    case 'DetailsDialog':
      return <DetailsDialogScreen view={viewOf(snapshot, 'DetailsDialog')} />
    case 'SessionSharing':
      return <SessionSharingScreen view={viewOf(snapshot, 'SessionSharing')} />
    case 'TotalSummary':
      return <TotalSummaryScreen view={viewOf(snapshot, 'TotalSummary')} />
    case 'TotalSummaryShare':
      return <TotalSummaryShareScreen view={viewOf(snapshot, 'TotalSummaryShare')} />
    default:
      return <UnportedScreen snapshot={snapshot} />
  }
}

export function App({ store }: { store: EngineStore }) {
  const snapshot = useSnapshot(store)
  const palette = useMemo(() => resolvePalette(snapshot.palette), [snapshot.palette])

  return (
    <StoreContext.Provider value={store}>
      <ThemeContext.Provider value={palette}>
        <div testId="app-root" style={{ width: '100%', height: '100%', backgroundColor: palette.background }}>
          <CurrentScreen snapshot={snapshot} />
        </div>
      </ThemeContext.Provider>
    </StoreContext.Provider>
  )
}
