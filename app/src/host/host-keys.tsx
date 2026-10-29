import { createContext, useContext } from 'react'

import { usePalette } from '../theme'
import { KeyCap, Pressable, Txt } from '../ui/kit'

/**
 * Key handler of the screens the host draws itself (no engine behind
 * them): version check, error and panic.
 */
export const HostKeysContext = createContext<((key: string) => void) | null>(null)

/** KeyHint for host screens: clicking it sends `sendKey` to the host. */
export function HostKeyHint({
  keyLabel,
  label,
  sendKey,
  color,
  testId,
}: {
  keyLabel: string
  label: string
  sendKey: string
  color?: string
  testId?: string
}) {
  const press = useContext(HostKeysContext)
  if (!press) throw new Error('HostKeyHint needs a HostKeysContext provider')
  const palette = usePalette()
  return (
    <Pressable
      testId={testId}
      onPress={() => press(sendKey)}
      style={{ gap: 8, paddingLeft: 8, paddingRight: 10, paddingTop: 6, paddingBottom: 6 }}
    >
      <KeyCap label={keyLabel} color={color} />
      <Txt color={palette.text} size={13} wrap={false}>
        {label}
      </Txt>
    </Pressable>
  )
}
