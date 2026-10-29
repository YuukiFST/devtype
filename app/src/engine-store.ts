import { useSyncExternalStore } from 'react'

import type { GameEngine, KeyInput } from './native'
import type { Snapshot } from './view-models'

/** Interval of the host frame loop; the screens' own timers run at 16-50 ms. */
export const FRAME_INTERVAL_MS = 16

const NAMED_KEYS = new Set([
  'space',
  'enter',
  'escape',
  'tab',
  'backspace',
  'left',
  'right',
  'up',
  'down',
  'home',
  'end',
  'pageup',
  'pagedown',
])

/** Builds the KeyInput a physical press of `key` would produce, for clickable controls. */
export function keyInputFor(key: string, modifiers: Partial<Omit<KeyInput, 'key' | 'keyChar'>> = {}): KeyInput {
  const keyChar = key === 'space' ? ' ' : NAMED_KEYS.has(key) ? undefined : key
  return { key, keyChar, shift: false, ctrl: false, alt: false, ...modifiers }
}

export type EngineStore = {
  getSnapshot: () => Snapshot
  subscribe: (listener: () => void) => () => void
  pressKey: (input: KeyInput) => void
  press: (key: string) => void
  /** Sends `count` presses of `key`, e.g. to move a list selection to a clicked row. */
  pressRepeated: (key: string, count: number) => void
  stop: () => void
}

export function createEngineStore(engine: GameEngine, onError: (error: unknown) => void): EngineStore {
  const listeners = new Set<() => void>()
  let lastJson = engine.snapshot()
  // SAFETY: GameEngine.snapshot serializes the Snapshot shape in game.rs.
  // Verified by: test/game-flow.e2e.test.ts
  let snapshot = JSON.parse(lastJson) as Snapshot

  const refresh = () => {
    const json = engine.snapshot()
    if (json === lastJson) return
    lastJson = json
    // SAFETY: as above.
    snapshot = JSON.parse(json) as Snapshot
    for (const listener of listeners) listener()
  }

  const guarded = (action: () => void) => {
    try {
      action()
      refresh()
    } catch (error) {
      onError(error)
    }
  }

  const timer = setInterval(() => guarded(() => engine.advance()), FRAME_INTERVAL_MS)

  const pressKey = (input: KeyInput) => guarded(() => engine.pressKey(input))

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    pressKey,
    press: (key) => pressKey(keyInputFor(key)),
    pressRepeated: (key, count) =>
      guarded(() => {
        for (let i = 0; i < count; i++) engine.pressKey(keyInputFor(key))
      }),
    stop: () => clearInterval(timer),
  }
}

export function useSnapshot(store: EngineStore): Snapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
