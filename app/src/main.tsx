import { render, type KeyEvent } from '@gpuix/react'

import { createHostController, HostRoot } from './host/host'
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

const outcome = native.runCli(process.argv.slice(2))
if (outcome.kind === 'exit') process.exit(outcome.exitCode)

const controller = createHostController({
  native,
  exit: (code) => process.exit(code),
  log: (line) => console.log(line),
  logError: (line) => console.error(line),
})

// gpuix exits with 0 when the window closes; an error or panic screen
// still means the run failed.
process.on('exit', () => {
  if (controller.failed()) process.exitCode = 1
})

controller.start(outcome)

render(<HostRoot controller={controller} />, {
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
    if (input) controller.pressKey(input)
  },
})
