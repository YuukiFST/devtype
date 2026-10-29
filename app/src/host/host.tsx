import { useSyncExternalStore } from 'react'

import { App } from '../app'
import { createEngineStore, type EngineStore } from '../engine-store'
import type { CliOutcome, CliScreenName, GameEngine, GameOptions, KeyInput, NativeModule } from '../native'
import { ErrorScreen, type ErrorView } from '../screens/error-screen'
import { PanicScreen, type PanicView } from '../screens/panic-screen'
import { VersionCheckScreen, type VersionCheckView } from '../screens/version-check-screen'
import { resolvePalette, ThemeContext, type Palette } from '../theme'
import type { RawPalette, Snapshot } from '../view-models'
import { HostKeysContext } from './host-keys'

/** How often the host looks for a panic on a background thread. */
const FAILURE_POLL_MS = 100

/** What the host does when the engine's screen asks to exit. */
type EngineRole =
  | { kind: 'game' }
  | { kind: 'repoList' }
  | { kind: 'repoPlay' }
  | { kind: 'trendingLanguage'; period: string }
  | { kind: 'trendingRepository' }

type EngineState = { kind: 'engine'; id: number; engine: GameEngine; store: EngineStore; role: EngineRole }

export type HostState =
  | { kind: 'starting' }
  | EngineState
  | { kind: 'version'; view: VersionCheckView; options: GameOptions }
  | { kind: 'error'; view: ErrorView }
  | { kind: 'panic'; view: PanicView }

type Failure = { kind: 'error'; lines: string[] } | { kind: 'panic'; view: PanicView }

export type HostDeps = {
  native: NativeModule
  exit: (code: number) => void
  /** Lines gittype prints on stdout. */
  log: (line: string) => void
  /** Lines gittype prints on stderr. */
  logError: (line: string) => void
}

export type HostController = {
  getState: () => HostState
  subscribe: (listener: () => void) => () => void
  /** Opens the window content for a GUI command `runCli` returned. */
  start: (outcome: CliOutcome) => void
  /** A key from the window, routed to the engine or the host screen. */
  pressKey: (input: KeyInput) => void
  /** A key for the host screens (version check, error, panic). */
  pressHostKey: (key: string) => void
  /** True while an error or panic screen is up: the process exits with 1. */
  failed: () => boolean
  palette: Palette
  dispose: () => void
}

/**
 * Drives one window through the flows gittype runs in sequence: command
 * screens, the release check, the game, and the error and panic screens.
 */
export function createHostController({ native, exit, log, logError }: HostDeps): HostController {
  // SAFETY: load_palette serializes palette_json, the RawPalette shape.
  // Verified by: app/test/host-flows.scratch.tsx
  const palette = resolvePalette(JSON.parse(native.loadPalette()) as RawPalette)
  const listeners = new Set<() => void>()
  let state: HostState = { kind: 'starting' }
  let nextEngineId = 1

  const setState = (next: HostState) => {
    if (state.kind === 'engine') state.store.stop()
    state = next
    for (const listener of listeners) listener()
  }

  const failed = () => state.kind === 'error' || state.kind === 'panic'

  const showFailure = (failure: Failure) => {
    if (failed()) return
    if (failure.kind === 'panic') {
      setState({ kind: 'panic', view: failure.view })
      return
    }
    for (const line of failure.lines) logError(line)
    setState({ kind: 'error', view: { lines: failure.lines } })
  }

  const takeFailure = (): Failure | null => {
    const json = native.takeFailure()
    // SAFETY: take_failure serializes exactly the Failure union (failure.rs).
    // Verified by: app/test/host-flows.scratch.tsx
    return json ? (JSON.parse(json) as Failure) : null
  }

  const onEngineError = (error: unknown) => {
    showFailure(takeFailure() ?? { kind: 'error', lines: [`❌ ${String(error)}`] })
  }

  const failurePoll = setInterval(() => {
    const failure = takeFailure()
    if (failure) showFailure(failure)
  }, FAILURE_POLL_MS)

  const runEngine = (create: () => GameEngine, role: EngineRole) => {
    let engine: GameEngine
    try {
      engine = create()
    } catch (error) {
      onEngineError(error)
      return
    }
    const store = createEngineStore(engine, onEngineError)
    const id = nextEngineId++
    store.subscribe(() => onSnapshot(id, store.getSnapshot()))
    setState({ kind: 'engine', id, engine, store, role })
    onSnapshot(id, store.getSnapshot())
  }

  const launchGame = (options: GameOptions) => runEngine(() => native.GameEngine.start(options), { kind: 'game' })

  /** `run_game_session` checks for a newer release before Loading. */
  const startGame = (options: GameOptions) => {
    setState({ kind: 'starting' })
    native.checkForUpdate().then(
      (update) => {
        if (update) setState({ kind: 'version', view: update, options })
        else launchGame(options)
      },
      () => launchGame(options),
    )
  }

  const startCliScreen = (screen: CliScreenName, role: EngineRole, language?: string, period?: string) =>
    runEngine(() => native.GameEngine.startCliScreen(screen, language, period), role)

  const onEngineExit = (role: EngineRole, selection: string | null) => {
    switch (role.kind) {
      case 'game':
      case 'repoList':
        exit(0)
        return
      case 'repoPlay':
        if (!selection) {
          log('Repository selection cancelled.')
          exit(0)
          return
        }
        log(`Starting devtype with repository: ${selection}`)
        startGame({ repo: selection })
        return
      case 'trendingLanguage':
        if (!selection) exit(0)
        else startCliScreen('trendingRepository', { kind: 'trendingRepository' }, selection, role.period)
        return
      case 'trendingRepository':
        if (!selection) exit(0)
        else startGame({ repo: `https://github.com/${selection}` })
        return
    }
  }

  const onSnapshot = (id: number, snapshot: Snapshot) => {
    if (state.kind !== 'engine' || state.id !== id) return
    if (snapshot.loadingFailure) {
      showFailure({ kind: 'error', lines: snapshot.loadingFailure })
      return
    }
    if (snapshot.exitRequested) onEngineExit(state.role, state.engine.cliSelection() ?? null)
  }

  const pressHostKey = (key: string) => {
    if (state.kind === 'version') {
      if (key === 'space') launchGame(state.options)
      else if (key === 'escape') exit(0)
    } else if (failed() && key === 'escape') {
      exit(1)
    }
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start: (outcome) => {
      switch (outcome.kind) {
        case 'game':
          startGame({ repoPath: outcome.repoPath, repo: outcome.repo, langs: outcome.langs })
          return
        case 'repoList':
          startCliScreen('repoList', { kind: 'repoList' })
          return
        case 'repoPlay':
          startCliScreen('repoPlay', { kind: 'repoPlay' })
          return
        case 'trending':
          if (outcome.language) {
            startCliScreen('trendingRepository', { kind: 'trendingRepository' }, outcome.language, outcome.period)
          } else {
            startCliScreen('trendingLanguage', { kind: 'trendingLanguage', period: outcome.period ?? 'daily' })
          }
          return
        default:
          throw new Error(`runCli outcome "${outcome.kind}" opens no window`)
      }
    },
    pressKey: (input) => {
      if (state.kind === 'engine') state.store.pressKey(input)
      else pressHostKey(input.key)
    },
    pressHostKey,
    failed,
    palette,
    dispose: () => {
      clearInterval(failurePoll)
      if (state.kind === 'engine') state.store.stop()
    },
  }
}

function HostScreen({ state }: { state: HostState }) {
  switch (state.kind) {
    case 'engine':
      return <App key={state.id} store={state.store} />
    case 'version':
      return <VersionCheckScreen view={state.view} />
    case 'error':
      return <ErrorScreen view={state.view} />
    case 'panic':
      return <PanicScreen view={state.view} />
    case 'starting':
      return null
  }
}

/** Window root: the engine's App, or a screen the host draws itself. */
export function HostRoot({ controller }: { controller: HostController }) {
  const state = useSyncExternalStore(controller.subscribe, controller.getState)
  return (
    <HostKeysContext.Provider value={controller.pressHostKey}>
      <ThemeContext.Provider value={controller.palette}>
        <div testId="host-root" style={{ width: '100%', height: '100%', backgroundColor: controller.palette.background }}>
          <HostScreen state={state} />
        </div>
      </ThemeContext.Provider>
    </HostKeysContext.Provider>
  )
}
