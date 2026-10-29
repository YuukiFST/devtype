import { spawn } from 'node:child_process'
import { useState } from 'react'

import { usePalette, withAlpha } from '../theme'
import type { ShareFallback, ShareMenuView } from '../view-models'
import { Card, Column, KeyCap, KeyHint, Pressable, Row, StyledLines, Txt, useStore } from './kit'
import { ScreenFrame } from './screen-frame'

/** The OS clipboard command; Ctrl+C in the window goes to the engine, which quits. */
function clipboardCommand(): [string, string[]] {
  if (process.platform === 'win32') return ['clip', []]
  if (process.platform === 'darwin') return ['pbcopy', []]
  return ['xclip', ['-selection', 'clipboard']]
}

function copyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const [command, args] = clipboardCommand()
    const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
    child.stdin.end(text)
  })
}

function FallbackPanel({ fallback }: { fallback: ShareFallback }) {
  const palette = usePalette()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copy = async () => setCopyState((await copyToClipboard(fallback.url)) ? 'copied' : 'failed')

  return (
    <Card accent={palette.warning} testId="share-fallback">
      <Txt color={palette.warning} size={18} weight={700}>
        {fallback.title}
      </Txt>
      <Txt color={palette.text} size={14}>
        {fallback.instruction}
      </Txt>
      <div
        style={{
          padding: 14,
          borderRadius: 10,
          backgroundColor: withAlpha(palette.info, 0.08),
          borderWidth: 1,
          borderColor: withAlpha(palette.info, 0.35),
          userSelect: 'text',
        }}
      >
        <Txt testId="share-fallback-url" color={palette.info} size={13} weight={700} mono>
          {fallback.url}
        </Txt>
      </div>
      <Row gap={14}>
        <Pressable
          testId="share-copy-url"
          onPress={copy}
          hoverBackground={withAlpha(palette.info, 0.85)}
          style={{ paddingLeft: 18, paddingRight: 18, paddingTop: 9, paddingBottom: 9, backgroundColor: palette.info }}
        >
          <Txt color={palette.background} size={14} weight={800} wrap={false}>
            {copyState === 'copied' ? 'Copied' : 'Copy URL'}
          </Txt>
        </Pressable>
        <Txt color={copyState === 'failed' ? palette.error : palette.text} size={13}>
          {copyState === 'failed'
            ? 'Could not reach the clipboard. Select the URL with the mouse instead.'
            : 'Copy the URL, then paste it into your browser.'}
        </Txt>
      </Row>
    </Card>
  )
}

/** Shared body of the session and total share screens: preview, platform menu, fallback URL. */
export function ShareMenuScreen({ view, frameTitle, testIdPrefix }: { view: ShareMenuView; frameTitle: string; testIdPrefix: string }) {
  const palette = usePalette()
  const store = useStore()
  const fallback = view.fallback

  return (
    <ScreenFrame
      title={frameTitle}
      centered
      maxWidth={860}
      hints={
        <>
          {fallback
            ? null
            : view.platforms.map((platform) => (
                <KeyHint
                  key={platform.key}
                  keyLabel={platform.key}
                  label={platform.name}
                  sendKey={platform.key}
                  color={palette.success}
                  testId={`${testIdPrefix}-hint-${platform.key}`}
                />
              ))}
          <div style={{ flexGrow: 1 }} />
          <KeyHint
            keyLabel="ESC"
            label={fallback ? fallback.escLabel : view.backLabel}
            sendKey="escape"
            color={palette.error}
            testId={`${testIdPrefix}-back`}
          />
        </>
      }
    >
      <Txt color={palette.info} size={22} weight={800} align="center">
        {view.title}
      </Txt>
      {fallback ? (
        <FallbackPanel fallback={fallback} />
      ) : (
        <>
          <Card title="PREVIEW">
            <Row justify="center">
              <StyledLines lines={[view.preview]} size={14} />
            </Row>
          </Card>
          <Column gap={10}>
            {view.platforms.map((platform) => (
              <Pressable
                key={platform.key}
                testId={`${testIdPrefix}-platform-${platform.key}`}
                onPress={() => store.press(platform.key)}
                hoverBackground={withAlpha(palette.success, 0.1)}
                style={{
                  gap: 14,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: withAlpha(palette.border, 0.5),
                  backgroundColor: palette.backgroundSecondary,
                }}
              >
                <KeyCap label={platform.key} color={palette.success} />
                <Txt color={palette.text} size={16} weight={600} wrap={false}>
                  {`Share on ${platform.name}`}
                </Txt>
              </Pressable>
            ))}
          </Column>
        </>
      )}
    </ScreenFrame>
  )
}
