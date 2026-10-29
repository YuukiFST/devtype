import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { GameEngine } = require('../native/devtype-native.node')
const engine = GameEngine.start({ repoPath: process.argv[2] })
const deadline = Date.now() + 120_000
let last = ''
while (Date.now() < deadline) {
  engine.advance()
  const snap = engine.snapshot()
  if (snap.screen !== last) { console.log('screen', snap.screen); last = snap.screen }
  if (snap.screen === 'Title') { console.log(JSON.stringify(snap.palette).slice(0, 120)); break }
  await Bun.sleep(16)
}
engine.pressKey({ key: 'space', keyChar: ' ', shift: false, ctrl: false, alt: false })
console.log('after space', engine.snapshot().screen)
