import { usePalette } from '../theme'
import { Card, KeyHint, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'
import { CacheLegend, PlayedRepositoryRow, type PlayedRepository } from './played-repository'
import { SelectionList } from './selection-list'

export type RepoPlayView = {
  repositories: PlayedRepository[]
  selected: number | null
}

export function RepoPlayScreen({ view }: { view: RepoPlayView }) {
  const palette = usePalette()
  return (
    <ScreenFrame
      title="Select Repository to Play"
      trailing={<CacheLegend />}
      hints={
        <>
          <KeyHint keyLabel="↑↓ / JK" label="Navigate" color={palette.keyNavigation} />
          <KeyHint keyLabel="SPACE" label="Play" sendKey="space" color={palette.keyAction} testId="repo-play-play" />
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="ESC" label="Return" sendKey="escape" color={palette.keyBack} testId="repo-play-return" />
        </>
      }
    >
      <Card title="PLAYED REPOSITORIES" grow>
        {view.repositories.length === 0 ? (
          <Txt color={palette.muted} size={14}>
            No repositories played yet.
          </Txt>
        ) : (
          <SelectionList
            items={view.repositories}
            selected={view.selected}
            confirmKey="space"
            testIdPrefix="repo-play-row"
            renderRow={(repo) => <PlayedRepositoryRow repo={repo} />}
          />
        )}
      </Card>
    </ScreenFrame>
  )
}
