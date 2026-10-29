import type { CodeRunKind, TypingView } from '../view-models'

export type RowRunKind = CodeRunKind | 'context'

export type CodeRow = {
  /** Source line number, only on the first visual row of a line. */
  number: number | null
  isCurrentLine: boolean
  runs: { kind: RowRunKind; text: string }[]
  hasCursor: boolean
}

function wrapRuns(runs: { kind: RowRunKind; text: string }[], columns: number): { kind: RowRunKind; text: string }[][] {
  const rows: { kind: RowRunKind; text: string }[][] = [[]]
  let used = 0
  for (const run of runs) {
    let rest = run.text
    while (rest.length > 0) {
      const room = columns - used
      if (room <= 0) {
        rows.push([])
        used = 0
        continue
      }
      const piece = rest.slice(0, room)
      rows[rows.length - 1]!.push({ kind: run.kind, text: piece })
      used += piece.length
      rest = rest.slice(piece.length)
    }
  }
  return rows
}

/**
 * Flattens context and challenge lines into wrapped visual rows, the way
 * gittype's TypingContentView wraps at the terminal width.
 */
export function buildCodeRows(code: TypingView['code'], columns: number): CodeRow[] {
  const rows: CodeRow[] = []
  const pushLine = (number: number, runs: { kind: RowRunKind; text: string }[], isCurrentLine: boolean) => {
    const wrapped = wrapRuns(runs, Math.max(8, columns))
    wrapped.forEach((rowRuns, i) => {
      rows.push({
        number: i === 0 ? number : null,
        isCurrentLine,
        runs: rowRuns,
        hasCursor: rowRuns.some((run) => run.kind === 'cursor' || run.kind === 'mistake'),
      })
    })
  }

  for (const line of code.preContext) pushLine(line.number, [{ kind: 'context', text: line.text }], false)
  code.lines.forEach((runs, i) => {
    const lineIndex = code.firstLineIndex + i
    pushLine(code.startLine + lineIndex, runs, lineIndex === code.currentLine)
  })
  for (const line of code.postContext) pushLine(line.number, [{ kind: 'context', text: line.text }], false)
  return rows
}

/** First row to show so the cursor row sits in the middle of `visibleRows`. */
export function centeredWindowStart(rows: CodeRow[], visibleRows: number): number {
  const cursorRow = rows.findIndex((row) => row.hasCursor)
  const anchor = cursorRow >= 0 ? cursorRow : Math.max(0, rows.findIndex((row) => row.isCurrentLine))
  return Math.max(0, anchor - Math.floor(visibleRows / 2))
}
