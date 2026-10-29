import { usePalette, withAlpha } from '../theme'
import { Card, KeyHint, Row, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'
import { CacheLegend, PlayedRepositoryRow, type PlayedRepository } from './played-repository'
import { useVisibleRows } from './selection-list'

export type RepoListView = {
  cacheDir: string
  repositories: PlayedRepository[]
}

/** Extra chrome above the list: the cache directory card. */
const CACHE_CARD_HEIGHT = 90

export function RepoListScreen({ view }: { view: RepoListView }) {
  const palette = usePalette()
  const visible = useVisibleRows() - Math.ceil(CACHE_CARD_HEIGHT / 40)
  const shown = view.repositories.slice(0, visible)
  const hidden = view.repositories.length - shown.length

  return (
    <ScreenFrame
      title="Played Repositories"
      trailing={<CacheLegend />}
      hints={
        <>
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="ESC" label="Return" sendKey="escape" color={palette.keyBack} testId="repo-list-return" />
        </>
      }
    >
      <Card padding={16}>
        <Row gap={10}>
          <Txt color={withAlpha(palette.text, 0.6)} size={13} weight={600} wrap={false}>
            Cache Directory:
          </Txt>
          <Txt color={palette.text} size={13} mono wrap={false} testId="repo-list-cache-dir">
            {view.cacheDir}
          </Txt>
        </Row>
      </Card>
      <Card title="REPOSITORY LIST" grow>
        {view.repositories.length === 0 ? (
          <Txt color={withAlpha(palette.text, 0.6)} size={14}>
            No repositories played yet.
          </Txt>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {shown.map((repo) => (
              <div
                key={`${repo.user}/${repo.name}`}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  height: 38,
                  paddingLeft: 14,
                  paddingRight: 14,
                  borderRadius: 8,
                  backgroundColor: withAlpha(palette.text, 0.03),
                }}
              >
                <PlayedRepositoryRow repo={repo} showUrl />
              </div>
            ))}
            {hidden > 0 ? (
              <Txt color={withAlpha(palette.text, 0.6)} size={12}>
                {`and ${hidden} more`}
              </Txt>
            ) : null}
          </div>
        )}
      </Card>
    </ScreenFrame>
  )
}
