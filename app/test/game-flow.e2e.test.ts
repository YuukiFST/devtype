/**
 * Source: the user's requirement that devtype keeps gittype's features with
 * nothing missing. This pins gittype's game flow (Loading → Title → three
 * Typing/StageSummary rounds → Animation) as the GUI drives it.
 */
import { afterAll, expect, test } from 'bun:test'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { viewOf } from '../src/view-models'
import { createFixture, startHarness, type Harness } from './harness'

const GOLDEN = join(import.meta.dir, 'golden', 'game-flow.txt')

let harness: Harness | undefined
afterAll(() => harness?.dispose())

function checkGolden(actual: string) {
  if (process.env.UPDATE_GOLDEN === '1' || !existsSync(GOLDEN)) {
    writeFileSync(GOLDEN, actual)
  }
  expect(actual).toBe(readFileSync(GOLDEN, 'utf8'))
}

test('a full session runs from loading to the rank animation', async () => {
  const fixture = createFixture()
  harness = await startHarness({ repoPath: fixture.repoPath }, fixture.home)
  const lines: string[] = []

  const title = viewOf(await harness.waitForScreen('Title'), 'Title')
  lines.push(`title.repository: ${title.repository?.user}/${title.repository?.name} @ ${title.repository?.branch}`)
  for (const difficulty of title.difficulties) {
    lines.push(`title.difficulty: ${difficulty.name} challenges=${difficulty.challengeCount}`)
  }
  lines.push(`title.selected: ${title.difficulties[title.selectedDifficulty]?.name}`)

  await harness.press('space')
  const waiting = viewOf(await harness.waitForScreen('Typing'), 'Typing')
  lines.push(`typing.state: ${waiting.state}`)
  lines.push(`typing.skips: ${waiting.metrics.skipsRemaining}`)

  for (let stage = 1; stage <= 3; stage++) {
    await harness.playStage()
    await harness.waitForScreen('StageSummary', 15_000)
    lines.push(`stage ${stage}: completed`)
    await harness.press('space')
  }

  const after = harness.snapshot().screen
  lines.push(`after stage 3: ${after === 'SessionSummary' ? 'Animation' : after}`)

  checkGolden(`${lines.join('\n')}\n`)
}, 120_000)
