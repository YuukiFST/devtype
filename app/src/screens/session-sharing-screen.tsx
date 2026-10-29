import { ShareMenuScreen } from '../ui/share-menu'
import type { SessionSharingView } from '../view-models'

export type { SessionSharingView }

export function SessionSharingScreen({ view }: { view: SessionSharingView }) {
  return <ShareMenuScreen view={view} frameTitle="Share Result" testIdPrefix="session-share" />
}
