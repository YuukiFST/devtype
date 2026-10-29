import { usePalette } from '../theme'
import type { RepositoryInfo } from '../view-models'
import { Row, Txt } from './kit'

/** `user/repo • branch • commit • ✓/⚠`, the repository line gittype shows. */
export function RepositoryChip({ repository }: { repository: RepositoryInfo | null }) {
  const palette = usePalette()
  if (!repository) return null
  return (
    <Row gap={10}>
      <Txt color={palette.text} size={13} weight={600} wrap={false}>
        {`${repository.user}/${repository.name}`}
      </Txt>
      {repository.branch ? (
        <Txt color={palette.muted} size={13} wrap={false}>
          {repository.branch}
        </Txt>
      ) : null}
      {repository.commit ? (
        <Txt color={palette.muted} size={13} mono wrap={false}>
          {repository.commit}
        </Txt>
      ) : null}
      <Txt color={repository.dirty ? palette.warning : palette.success} size={13} wrap={false}>
        {repository.dirty ? '⚠ uncommitted changes' : '✓ clean'}
      </Txt>
    </Row>
  )
}
