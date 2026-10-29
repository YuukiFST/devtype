import { useMemo } from 'react'

import { useSnapshot, type EngineStore } from './engine-store'
import { HelpScreen } from './screens/help-screen'
import { InfoDialogScreen } from './screens/info-dialog-screen'
import { SettingsScreen } from './screens/settings-screen'
import { TitleScreen } from './screens/title-screen'
import { TypingScreen } from './screens/typing-screen'
import { AnimationScreen } from './screens/animation-screen'
import { LoadingScreen } from './screens/loading-screen'
import { SessionFailureScreen } from './screens/session-failure-screen'
import { StageSummaryScreen } from './screens/stage-summary-screen'
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
