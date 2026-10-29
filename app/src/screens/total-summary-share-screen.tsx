import { ShareMenuScreen } from '../ui/group-b-share'
import type { TotalSummaryShareView } from '../view-models'

export type { TotalSummaryShareView }

export function TotalSummaryShareScreen({ view }: { view: TotalSummaryShareView }) {
  return <ShareMenuScreen view={view} frameTitle="Share Total Results" testIdPrefix="total-share" />
}
