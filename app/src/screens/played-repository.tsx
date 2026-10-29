import { usePalette, withAlpha } from '../theme'
import { Row, Txt } from '../ui/kit'

/** A repository from the play history, as RepoList and RepoPlay show it. */
export type PlayedRepository = {
  user: string
  name: string
  /** Whether the clone is still in the local cache. */
  cached: boolean
  /** Display names of the languages it has challenges in. */
  languages: string[]
  url: string
}

export function CacheDot({ cached }: { cached: boolean }) {
  const palette = usePalette()
  return (
    <Txt color={cached ? palette.success : withAlpha(palette.text, 0.5)} size={14} wrap={false}>
      {cached ? '●' : '○'}
    </Txt>
  )
}

export function CacheLegend() {
  const palette = usePalette()
  return (
    <Row gap={14}>
      <Row gap={6}>
        <CacheDot cached />
        <Txt color={palette.text} size={13} wrap={false}>
          Cached
        </Txt>
      </Row>
      <Row gap={6}>
        <CacheDot cached={false} />
        <Txt color={palette.text} size={13} wrap={false}>
          Not Cached
        </Txt>
      </Row>
    </Row>
  )
}

export function LanguageList({ languages }: { languages: string[] }) {
  const palette = usePalette()
  if (languages.length === 0) {
    return (
      <Txt color={withAlpha(palette.text, 0.6)} size={13} wrap={false}>
        No challenges
      </Txt>
    )
  }
  return (
    <Txt color={palette.info} size={13} wrap={false}>
      {languages.join(', ')}
    </Txt>
  )
}

export function PlayedRepositoryRow({ repo, showUrl }: { repo: PlayedRepository; showUrl?: boolean }) {
  const palette = usePalette()
  return (
    <>
      <CacheDot cached={repo.cached} />
      <div style={{ width: 300, flexShrink: 0, overflow: 'hidden' }}>
        <Txt color={palette.text} size={14} weight={700} wrap={false}>
          {`${repo.user}/${repo.name}`}
        </Txt>
      </div>
      <div style={{ flexGrow: 1, flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
        <LanguageList languages={repo.languages} />
      </div>
      {showUrl ? (
        <Txt color={withAlpha(palette.text, 0.6)} size={12} mono wrap={false}>
          {repo.url}
        </Txt>
      ) : null}
    </>
  )
}
