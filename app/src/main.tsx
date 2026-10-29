import { render, type KeyEvent } from '@gpuix/react'

import { App } from './app'
import { createEngineStore } from './engine-store'
import { native, type KeyInput } from './native'

function toKeyInput(event: KeyEvent): KeyInput | null {
  if (!event.key) return null
  return {
    key: event.key,
    keyChar: event.keyChar,
    shift: event.modifiers?.shift ?? false,
    ctrl: event.modifiers?.ctrl ?? false,
    alt: event.modifiers?.alt ?? false,
  }
}

const engine = native.GameEngine.start({ repoPath: process.argv[2] })
const store = createEngineStore(engine, (error) => {
  console.error(error)
  process.exit(1)
})

store.subscribe(() => {
  if (store.getSnapshot().exitRequested) process.exit(0)
})

render(<App store={store} />, {
  title: 'devtype',
  width: 1180,
  height: 800,
  minWidth: 900,
  minHeight: 640,
  tabNavigation: false,
  keyboardFocusDim: false,
  focus: process.env.GPUIX_BACKGROUND !== '1',
  onKeyDown: (event) => {
    const input = toKeyInput(event)
    if (input) store.pressKey(input)
  },
})
