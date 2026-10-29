import { usePalette } from '../theme'
import { Badge, Card, Column, KeyHint, Row, Txt } from '../ui/kit'
import { SelectableRow, TabBar } from '../ui/tabs'
import { ScreenFrame } from '../ui/screen-frame'

export type SettingsView = {
  sections: string[]
  sectionIndex: number
  sectionDescription: string
  colorModes: string[]
  selectedColorMode: number | null
  themes: { id: string; name: string }[]
  selectedTheme: number | null
  themeDescription: string | null
  /** The theme's 15 key roles; empty unless the Theme tab has a selection. */
  colorPreview: { name: string; label: string; color: string | null }[]
  isPreviewMode: boolean
}

const THEME_SECTION_INDEX = 1

export function SettingsScreen({ view }: { view: SettingsView }) {
  const palette = usePalette()
  const isThemeSection = view.sectionIndex === THEME_SECTION_INDEX
  const listTitle = view.sections[view.sectionIndex] ?? ''
  const items = isThemeSection ? view.themes.map((theme) => theme.name) : view.colorModes
  const selectedIndex = isThemeSection ? view.selectedTheme : view.selectedColorMode

  return (
    <ScreenFrame
      title="Settings"
      trailing={view.isPreviewMode ? <Badge color={palette.warning}>Live preview</Badge> : null}
      maxWidth={1000}
      hints={
        <>
          <KeyHint keyLabel="← / H" label="Previous tab" sendKey="left" color={palette.keyNavigation} testId="settings-left" />
          <KeyHint keyLabel="→ / L" label="Next tab" sendKey="right" color={palette.keyNavigation} testId="settings-right" />
          <KeyHint keyLabel="↑ / K" label="Up" sendKey="up" color={palette.keyNavigation} testId="settings-up" />
          <KeyHint keyLabel="↓ / J" label="Down" sendKey="down" color={palette.keyNavigation} testId="settings-down" />
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="SPACE" label="Save" sendKey="space" color={palette.keyAction} testId="settings-save" />
          <KeyHint keyLabel="ESC" label="Cancel" sendKey="escape" color={palette.keyBack} testId="settings-cancel" />
        </>
      }
    >
      <Row>
        <TabBar tabs={view.sections} selectedIndex={view.sectionIndex} testIdPrefix="settings-tab" />
      </Row>

      <Row align="stretch" gap={16} grow>
        <div style={{ display: 'flex', flexDirection: 'column', width: 300, flexShrink: 0 }}>
          <Card title={listTitle.toUpperCase()} accent={palette.keyAction} grow padding={14} testId="settings-list">
            <Column gap={2}>
              {items.map((label, index) => (
                <SelectableRow
                  key={`${listTitle}-${label}`}
                  label={label}
                  index={index}
                  selectedIndex={selectedIndex}
                  selectKey="space"
                  testId={`settings-item-${index}`}
                />
              ))}
            </Column>
          </Card>
        </div>

        <Card title="DESCRIPTION" accent={palette.info} grow testId="settings-description">
          <Txt color={palette.text} size={14}>
            {view.sectionDescription}
          </Txt>
          {isThemeSection && view.themeDescription ? (
            <Txt color={palette.text} size={14}>
              {view.themeDescription}
            </Txt>
          ) : null}
          {view.colorPreview.length > 0 ? <ColorPreview roles={view.colorPreview} /> : null}
        </Card>
      </Row>
    </ScreenFrame>
  )
}

function ColorPreview({ roles }: { roles: SettingsView['colorPreview'] }) {
  const palette = usePalette()
  return (
    <Column gap={8}>
      <Txt color={palette.title} size={13} weight={700}>
        Color Preview
      </Txt>
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', rowGap: 6, columnGap: 18 }}>
        {roles.map((role) => (
          <div
            key={role.name}
            testId={`settings-preview-${role.name.toLowerCase().replace(/ /g, '-')}`}
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, width: 280 }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: role.color ?? palette.text,
              }}
            />
            <Txt color={role.color ?? palette.text} size={13} wrap={false}>
              {role.label}
            </Txt>
          </div>
        ))}
      </div>
    </Column>
  )
}
