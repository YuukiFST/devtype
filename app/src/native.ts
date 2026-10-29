import type * as Native from '../native/index'

export type NativeModule = typeof Native

// SAFETY: the .node file is built from crates/devtype-native, and napi-rs
// generates ../native/index.d.ts from the same source, so the shapes match.
// A plain `require` of a literal path lets `bun build --compile` embed it.
// Verified by: test/game-flow.e2e.test.ts
export const native = require('../native/devtype-native.node') as NativeModule

/** A `CliScreen` value; the generated `const enum` has no runtime object. */
export type CliScreenName = `${Native.CliScreen}`

export type { CliOutcome, GameEngine, GameOptions, KeyInput, UpdateInfo } from '../native/index'
