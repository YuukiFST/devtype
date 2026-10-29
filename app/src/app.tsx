import { useMemo } from 'react'

import { useSnapshot, type EngineStore } from './engine-store'
import { TitleScreen } from './screens/title-screen'
import { TypingScreen } from './screens/typing-screen'
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
