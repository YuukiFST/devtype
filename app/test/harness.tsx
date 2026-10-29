import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createTestRoot } from '@gpuix/react/testing'

import { App } from '../src/app'
import { createEngineStore, keyInputFor, type EngineStore } from '../src/engine-store'
import type { GameOptions } from '../src/native'
import type { Snapshot } from '../src/view-models'

const FIXTURE_FILES: Record<string, string> = {
  'src/lib.rs': `/// Adds two numbers.
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

pub struct Counter {
    count: u32,
}

impl Counter {
    pub fn new() -> Self {
        Self { count: 0 }
    }

    pub fn increment(&mut self) -> u32 {
        self.count += 1;
        self.count
    }
}
`,
  'src/util.py': `def fizzbuzz(n):
    for i in range(1, n + 1):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        else:
            print(i)


class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)
`,
}

const FIXTURE_PREFIX = 'devtype-e2e-'

/**
 * The engine keeps the SQLite database and log file open until the process
 * exits, and Windows refuses to delete open files, so each run removes the
 * fixtures earlier runs left behind.
 */
function removeStaleFixtures() {
  for (const entry of readdirSync(tmpdir())) {
    if (!entry.startsWith(FIXTURE_PREFIX)) continue
    try {
      rmSync(join(tmpdir(), entry), { recursive: true, force: true })
    } catch {
      // Still open by a live run; the next run gets it.
    }
  }
}

/** A throwaway git repository with a few functions, and an isolated app home. */
export function createFixture(): { repoPath: string; home: string } {
  removeStaleFixtures()
  const root = mkdtempSync(join(tmpdir(), FIXTURE_PREFIX))
  const repoPath = join(root, 'fixture-repo')
  const home = join(root, 'home')
  mkdirSync(home, { recursive: true })
  for (const [file, content] of Object.entries(FIXTURE_FILES)) {
    mkdirSync(join(repoPath, file, '..'), { recursive: true })
    writeFileSync(join(repoPath, file), content)
  }
  const git = (...args: string[]) =>
    execFileSync('git', ['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', ...args], {
      cwd: repoPath,
      stdio: 'ignore',
    })
  git('init', '-q', '-b', 'main')
  git('remote', 'add', 'origin', 'https://github.com/fixture/sample.git')
  git('add', '.')
  git('commit', '-q', '-m', 'chore: add fixture')
  return { repoPath, home }
}

export type Harness = {
  store: EngineStore
  snapshot: () => Snapshot
  press: (key: string) => Promise<void>
  type: (text: string) => Promise<void>
  waitForScreen: (screen: Snapshot['screen'], timeoutMs?: number) => Promise<Snapshot>
  screenshot: (path: string) => Promise<void>
  dispose: () => void
}

export async function startHarness(options: GameOptions, home: string): Promise<Harness> {
  process.env.DEVTYPE_HOME = home
  const { native } = await import('../src/native')
  const engine = native.GameEngine.start(options)
  const store = createEngineStore(engine, (error) => {
    throw error
  })
  const { render, renderer } = createTestRoot({ width: 1180, height: 800, tabNavigation: false, keyboardFocusDim: false })
  render(<App store={store} />)

  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve, 40))
    await renderer.flush()
  }

  return {
    store,
    snapshot: () => store.getSnapshot(),
    press: async (key) => {
      store.press(key)
      await settle()
    },
    type: async (text) => {
      for (const ch of text) {
        if (ch === '\n') store.press('enter')
        else if (ch === '\t') store.press('tab')
        else if (ch === ' ') store.press('space')
        else store.pressKey(keyInputFor(ch, { shift: ch !== ch.toLowerCase() }))
      }
      await settle()
    },
    waitForScreen: async (screen, timeoutMs = 60_000) => {
      const deadline = Date.now() + timeoutMs
      while (Date.now() < deadline) {
        const current = store.getSnapshot()
        if (current.screen === screen) {
          await settle()
          return current
        }
        await new Promise((resolve) => setTimeout(resolve, 25))
      }
      throw new Error(`timed out waiting for ${screen}; still on ${store.getSnapshot().screen}`)
    },
    screenshot: async (path) => {
      await settle()
      renderer.captureScreenshot(path)
    },
    dispose: () => store.stop(),
  }
}
