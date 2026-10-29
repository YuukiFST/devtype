import { usePalette, withAlpha } from '../theme'
import { Badge, Card, KeyHint, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'
import { SelectionList } from './selection-list'

export type TrendingRepositorySelectionView = {
  repositories: {
    /** `owner/repo`. */
    name: string
    /** `Unknown` when GitHub reports none. */
    language: string
    /** `No description` when GitHub reports none. */
    description: string
  }[]
  selected: number | null
}

export function TrendingRepositorySelectionScreen({ view }: { view: TrendingRepositorySelectionView }) {
  const palette = usePalette()
  return (
    <ScreenFrame
      title="Trending"
      hints={
        <>
          <KeyHint keyLabel="↑↓ / JK" label="Navigate" color={palette.keyNavigation} />
          <KeyHint
            keyLabel="SPACE"
            label="Play"
            sendKey="space"
            color={palette.keyAction}
            testId="trending-repository-play"
          />
          <div style={{ flexGrow: 1 }} />
          <KeyHint
            keyLabel="ESC"
            label="Return"
            sendKey="escape"
            color={palette.keyBack}
            testId="trending-repository-return"
          />
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Txt color={palette.title} size={20} weight={700}>
          Select Trending Repository to Play
        </Txt>
        <Txt color={withAlpha(palette.text, 0.6)} size={13}>
          Currently trending repositories
        </Txt>
      </div>
      <Card title="TRENDING REPOSITORIES" grow>
        {view.repositories.length === 0 ? (
          <Txt color={withAlpha(palette.text, 0.6)} size={14}>
            No trending repositories found.
          </Txt>
        ) : (
          <SelectionList
            items={view.repositories}
            selected={view.selected}
            confirmKey="space"
            testIdPrefix="trending-repository-row"
            renderRow={(repo, index) => (
              <>
                <div style={{ width: 28, flexShrink: 0 }}>
                  <Txt color={withAlpha(palette.text, 0.6)} size={13} mono wrap={false}>
                    {`${String(index + 1).padStart(2, ' ')}.`}
                  </Txt>
                </div>
                <div style={{ width: 300, flexShrink: 0, overflow: 'hidden' }}>
                  <Txt color={palette.text} size={14} weight={700} wrap={false}>
                    {repo.name}
                  </Txt>
                </div>
                <div style={{ width: 130, flexShrink: 0, display: 'flex', flexDirection: 'row' }}>
                  <Badge color={palette.success}>{repo.language}</Badge>
                </div>
                <div style={{ flexGrow: 1, flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
                  <Txt color={withAlpha(palette.text, 0.6)} size={13} wrap={false}>
                    {repo.description}
                  </Txt>
                </div>
              </>
            )}
          />
        )}
      </Card>
    </ScreenFrame>
  )
}
