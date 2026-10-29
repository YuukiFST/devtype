import { HostKeyHint } from '../host/host-keys'
import { usePalette, withAlpha } from '../theme'
import { Card, Column, Row, Txt } from '../ui/kit'
import { ScreenFrame } from '../ui/screen-frame'

export const RELEASES_URL = 'https://github.com/YuukiFST/devtype/releases/latest'

export type VersionCheckView = {
  currentVersion: string
  latestVersion: string
}

export function VersionCheckScreen({ view }: { view: VersionCheckView }) {
  const palette = usePalette()
  return (
    <ScreenFrame
      title="Update Available"
      centered
      maxWidth={620}
      hints={
        <>
          <div style={{ flexGrow: 1 }} />
          <HostKeyHint
            keyLabel="SPACE"
            label="Continue"
            sendKey="space"
            color={palette.success}
            testId="version-continue"
          />
          <HostKeyHint keyLabel="ESC" label="Exit" sendKey="escape" color={palette.error} testId="version-exit" />
          <div style={{ flexGrow: 1 }} />
        </>
      }
    >
      <Card accent={palette.warning} padding={28}>
        <Column align="center" gap={18}>
          <Txt color={palette.warning} size={22} weight={800} align="center">
            devtype Update Available
          </Txt>
          <Column gap={6} align="center">
            <Row gap={10}>
              <Txt color={palette.text} size={15} wrap={false}>
                Current version:
              </Txt>
              <Txt color={palette.error} size={15} weight={700} mono wrap={false} testId="version-current">
                {`v${view.currentVersion}`}
              </Txt>
            </Row>
            <Row gap={10}>
              <Txt color={palette.text} size={15} wrap={false}>
                Latest version:
              </Txt>
              <Txt color={palette.success} size={15} weight={700} mono wrap={false} testId="version-latest">
                {`v${view.latestVersion}`}
              </Txt>
            </Row>
          </Column>
          <Column gap={6} align="center">
            <Txt color={withAlpha(palette.text, 0.6)} size={13} align="center">
              To update, download the latest release:
            </Txt>
            <Txt color={palette.info} size={13} mono wrap={false}>
              {RELEASES_URL}
            </Txt>
          </Column>
        </Column>
      </Card>
    </ScreenFrame>
  )
}
