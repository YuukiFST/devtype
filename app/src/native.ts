import { createRequire } from 'node:module'

import type * as Native from '../native/index'

const require = createRequire(import.meta.url)

// SAFETY: the .node file is built from crates/devtype-native, and napi-rs
// generates ../native/index.d.ts from the same source, so the shapes match.
// Verified by: test/game-flow.e2e.test.ts
export const native = require('../native/devtype-native.node') as typeof Native

export type { GameEngine, GameOptions, KeyInput } from '../native/index'
