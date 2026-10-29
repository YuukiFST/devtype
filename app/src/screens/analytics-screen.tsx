import { useWindowSize } from '@gpuix/react'

import { usePalette, withAlpha, type Palette } from '../theme'
import { Card, Column, KeyHint, Pressable, Row, Stat, Txt, useStore } from '../ui/kit'
import { BarChart, LineChart } from '../ui/group-c-charts'
import { ListRow, MetricLine, mutedColor, selectListRow, useScrollWindow } from '../ui/group-c-widgets'
import { ScreenFrame } from '../ui/screen-frame'
import type { PaletteRole } from '../view-models'

export type AnalyticsMetric = { label: string; value: string; tone: PaletteRole }

export type AnalyticsTrend = {
  points: { date: string; value: number }[]
  min: number
  max: number
  yBounds: [number, number]
  yLabels: string[]
  xLabels: string[]
}

export type AnalyticsDetail = {
  name: string
  /** Present when per-item stats exist; otherwise `fallback` has the list values only. */
  sections?: { title: string; items: AnalyticsMetric[] }[]
  fallback?: AnalyticsMetric[]
}

export type AnalyticsList = {
  items: { name: string; cpm: string }[]
  selectedIndex: number | null
  detail: AnalyticsDetail | null
}

export type AnalyticsTab = 'Overview' | 'Trends' | 'Repositories' | 'Languages'

export type AnalyticsView = {
  title: string
  viewMode: AnalyticsTab
  tabs: { name: AnalyticsTab; active: boolean }[]
  loadingMessage: string
  data: {
    overview: {
      stats: AnalyticsMetric[]
      activity: {
        hasData: boolean
        /** The last 90 days, oldest first. */
        days: { key: string; label: string; count: number }[]
        totalSessions: number
        maxPerDay: number
        emptyMessage: string
      }
      topRepositories: { name: string; cpm: string }[]
      topLanguages: { name: string; cpm: string }[]
    }
    trends: {
      cpm: AnalyticsTrend
      accuracy: AnalyticsTrend
      cpmEmptyMessage: string
      accuracyEmptyMessage: string
    }
    repositories: AnalyticsList
    languages: AnalyticsList
    currentStreak: number
  } | null
}

type AnalyticsData = NonNullable<AnalyticsView['data']>

/** Top bar, hint bar, frame padding, tab bar and gaps. */
const CHROME_HEIGHT = 52 + 50 + 48 + 44 + 18
const CONTENT_MAX_WIDTH = 1120
const BAR_SLOT_WIDTH = 24
const LIST_ROW_HEIGHT = 34
/** OverviewView's bottom panels are 8 rows tall: 6 rows inside the borders. */
const RANKED_ROWS = 6

function contentSize(windowSize: { width: number; height: number }) {
  return {
    width: Math.min(windowSize.width - 56, CONTENT_MAX_WIDTH),
    height: windowSize.height - CHROME_HEIGHT,
  }
}

function TabBar({ view }: { view: AnalyticsView }) {
  const palette = usePalette()
  const store = useStore()
  const activeIndex = view.tabs.findIndex((tab) => tab.active)
  const selectTab = (index: number) => {
    const steps = index - activeIndex
    if (steps !== 0) store.pressRepeated(steps > 0 ? 'right' : 'left', Math.abs(steps))
  }
  return (
    <Row gap={8}>
      {view.tabs.map((tab, index) => (
        <Pressable
          key={tab.name}
          testId={`analytics-tab-${tab.name.toLowerCase()}`}
          onPress={() => selectTab(index)}
          hoverBackground={withAlpha(palette.keyAction, 0.12)}
          style={{
            height: 36,
            paddingLeft: 18,
            paddingRight: 18,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: tab.active ? palette.keyAction : withAlpha(palette.border, 0.5),
            backgroundColor: tab.active ? withAlpha(palette.keyAction, 0.16) : palette.backgroundSecondary,
          }}
        >
          <Txt color={tab.active ? palette.title : mutedColor(palette)} size={14} weight={tab.active ? 700 : 500} wrap={false}>
            {tab.name}
          </Txt>
        </Pressable>
      ))}
    </Row>
  )
}

function RankedList({ title, rows, empty }: { title: string; rows: { name: string; cpm: string }[]; empty: string }) {
  const palette = usePalette()
  return (
    <Card title={title} grow padding={16}>
      {rows.length === 0 ? (
        <Txt color={mutedColor(palette)} size={13}>
          {empty}
        </Txt>
      ) : (
        <Column gap={2}>
          {rows.slice(0, RANKED_ROWS).map((row, i) => (
            <Row key={row.name} gap={8}>
              <Txt color={mutedColor(palette)} size={13} mono wrap={false}>{`${i + 1}.`}</Txt>
              <Txt color={palette.text} size={13} wrap={false}>
                {row.name}
              </Txt>
              <div style={{ flexGrow: 1 }} />
              <Txt color={palette.cpmWpm} size={13} mono wrap={false}>
                {row.cpm}
              </Txt>
            </Row>
          ))}
        </Column>
      )}
    </Card>
  )
}

function OverviewTab({ data }: { data: AnalyticsData }) {
  const palette = usePalette()
  const size = contentSize(useWindowSize())
  const { activity } = data.overview
  const dayCount = Math.max(7, Math.min(90, Math.floor((size.width - 40) / BAR_SLOT_WIDTH)))
  const days = activity.days.slice(-dayCount)
  const { topRepositories, topLanguages } = data.overview
  const rankedRows = Math.max(1, Math.min(RANKED_ROWS, Math.max(topRepositories.length, topLanguages.length)))
  // What is left after the stats card, the ranked lists and the activity card's own padding and title.
  const chartHeight = Math.max(90, size.height - 294 - rankedRows * 22)

  return (
    <>
      <Card title="OVERVIEW (LAST 7 DAYS)" padding={18} testId="analytics-overview">
        <Row justify="space-between" gap={16} wrap>
          {data.overview.stats.map((stat) => (
            <Stat key={stat.label} label={stat.label.toUpperCase()} value={stat.value} color={palette[stat.tone]} size={20} />
          ))}
        </Row>
      </Card>
      <Card
        title={
          activity.hasData
            ? `RECENT ACTIVITY - ${days.length} DAYS | ${activity.totalSessions} TOTAL SESSIONS | MAX: ${activity.maxPerDay}/DAY`
            : 'RECENT ACTIVITY'
        }
        grow
        padding={18}
        testId="analytics-activity"
      >
        {activity.hasData ? (
          <BarChart
            values={days.map((day) => day.count)}
            labels={days.map((day) => day.label)}
            height={chartHeight}
            color={palette.cpmWpm}
          />
        ) : (
          <Column grow align="center" justify="center">
            <Txt color={mutedColor(palette)} size={14} align="center">
              {activity.emptyMessage}
            </Txt>
          </Column>
        )}
      </Card>
      <Row align="stretch" gap={18}>
        <RankedList title="TOP REPOSITORIES (LAST 90 DAYS)" rows={data.overview.topRepositories} empty="No repository data available" />
        <RankedList title="TOP LANGUAGES (LAST 90 DAYS)" rows={data.overview.topLanguages} empty="No language data available" />
      </Row>
    </>
  )
}

function TrendCard({
  title,
  trend,
  empty,
  yTitle,
  color,
  height,
  width,
  testId,
}: {
  title: string
  trend: AnalyticsTrend
  empty: string
  yTitle: string
  color: string
  height: number
  width: number
  testId: string
}) {
  const palette = usePalette()
  return (
    <Card title={title} grow padding={18} testId={testId}>
      {trend.points.length === 0 ? (
        <Column grow align="center" justify="center">
          <Txt color={mutedColor(palette)} size={14} align="center">
            {empty}
          </Txt>
        </Column>
      ) : (
        <LineChart
          values={trend.points.map((point) => point.value)}
          yBounds={trend.yBounds}
          yLabels={trend.yLabels}
          xLabels={trend.xLabels}
          yTitle={yTitle}
          width={width}
          height={height}
          color={color}
        />
      )}
    </Card>
  )
}

function TrendsTab({ data }: { data: AnalyticsData }) {
  const palette = usePalette()
  const size = contentSize(useWindowSize())
  // Two stacked cards, each with padding and a title line.
  const chartHeight = Math.max(80, Math.floor((size.height - 18) / 2) - 36 - 30)
  const chartWidth = size.width - 38
  return (
    <>
      <TrendCard
        title="CPM PERFORMANCE TREND"
        trend={data.trends.cpm}
        empty={data.trends.cpmEmptyMessage}
        yTitle="CPM"
        color={palette.cpmWpm}
        height={chartHeight}
        width={chartWidth}
        testId="analytics-trend-cpm"
      />
      <TrendCard
        title="ACCURACY PERFORMANCE TREND"
        trend={data.trends.accuracy}
        empty={data.trends.accuracyEmptyMessage}
        yTitle="ACC %"
        color={palette.accuracy}
        height={chartHeight}
        width={chartWidth}
        testId="analytics-trend-accuracy"
      />
    </>
  )
}

function DetailPanel({
  title,
  label,
  detail,
  noneTitle,
  noneHint,
}: {
  title: string
  label: string
  detail: AnalyticsDetail | null
  noneTitle: string
  noneHint: string
}) {
  const palette = usePalette()
  if (!detail) {
    return (
      <Card title={title} grow testId="analytics-detail">
        <Column grow align="center" justify="center" gap={8}>
          <Txt color={mutedColor(palette)} size={16} weight={700}>
            {noneTitle}
          </Txt>
          <Txt color={mutedColor(palette)} size={13}>
            {noneHint}
          </Txt>
        </Column>
      </Card>
    )
  }
  return (
    <Card title={title} grow testId="analytics-detail">
      <Row gap={8}>
        <Txt color={mutedColor(palette)} size={14} wrap={false}>
          {label}
        </Txt>
        <Txt color={palette.info} size={16} weight={700} wrap={false}>
          {detail.name}
        </Txt>
      </Row>
      {detail.sections ? (
        <Row align="stretch" gap={14} wrap>
          {detail.sections.map((section) => (
            <DetailSection key={section.title} title={section.title} items={section.items} palette={palette} />
          ))}
        </Row>
      ) : (
        <Column gap={2}>
          {(detail.fallback ?? []).map((item) => (
            <MetricLine key={item.label} label={item.label} value={item.value} color={palette[item.tone]} />
          ))}
        </Column>
      )}
    </Card>
  )
}

function DetailSection({ title, items, palette }: { title: string; items: AnalyticsMetric[]; palette: Palette }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        width: 290,
        flexGrow: 1,
        padding: 12,
        borderRadius: 10,
        backgroundColor: withAlpha(palette.background, 0.5),
      }}
    >
      <Txt color={palette.text} size={12} weight={700} wrap={false}>
        {title.toUpperCase()}
      </Txt>
      {items.map((item) => (
        <MetricLine key={item.label} label={item.label} value={item.value} color={palette[item.tone]} />
      ))}
    </div>
  )
}

function ListTab({
  list,
  listTitle,
  detailTitle,
  label,
  emptyList,
  noneTitle,
  noneHint,
}: {
  list: AnalyticsList
  listTitle: string
  detailTitle: string
  label: string
  emptyList: string
  noneTitle: string
  noneHint: string
}) {
  const palette = usePalette()
  const store = useStore()
  const size = contentSize(useWindowSize())
  const visibleRows = Math.max(3, Math.floor((size.height - 70) / LIST_ROW_HEIGHT))
  const start = useScrollWindow(list.selectedIndex, list.items.length, visibleRows)
  const visible = list.items.slice(start, start + visibleRows)

  return (
    <Row align="stretch" gap={18} grow>
      <div style={{ display: 'flex', flexDirection: 'column', width: Math.round(size.width * 0.38), flexShrink: 0 }}>
        <Card title={listTitle} grow padding={16} testId="analytics-list">
          {list.items.length === 0 ? (
            <Txt color={mutedColor(palette)} size={13}>
              {emptyList}
            </Txt>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
              {visible.map((item, i) => {
                const index = start + i
                const selected = index === list.selectedIndex
                return (
                  <ListRow
                    key={`${item.name}-${index}`}
                    selected={selected}
                    height={LIST_ROW_HEIGHT}
                    testId={`analytics-list-row-${index}`}
                    onPress={() => selectListRow(store, list.selectedIndex, index)}
                  >
                    <Txt color={selected ? palette.keyAction : withAlpha(palette.keyAction, 0)} size={12} wrap={false}>
                      ▶
                    </Txt>
                    <Txt color={selected ? palette.title : palette.text} size={13} weight={selected ? 700 : 400} wrap={false}>
                      {item.name}
                    </Txt>
                    <div style={{ flexGrow: 1 }} />
                    <Txt color={palette.cpmWpm} size={13} mono wrap={false}>
                      {item.cpm}
                    </Txt>
                  </ListRow>
                )
              })}
            </div>
          )}
        </Card>
      </div>
      <DetailPanel title={detailTitle} label={label} detail={list.detail} noneTitle={noneTitle} noneHint={noneHint} />
    </Row>
  )
}

function AnalyticsContent({ view }: { view: AnalyticsView }) {
  const palette = usePalette()
  const { data } = view
  if (!data) {
    return (
      <Column grow align="center" justify="center">
        <Txt color={mutedColor(palette)} size={15}>
          {view.loadingMessage}
        </Txt>
      </Column>
    )
  }
  switch (view.viewMode) {
    case 'Overview':
      return <OverviewTab data={data} />
    case 'Trends':
      return <TrendsTab data={data} />
    case 'Repositories':
      return (
        <ListTab
          list={data.repositories}
          listTitle="REPOSITORIES"
          detailTitle="REPOSITORY DETAILS (LAST 90 DAYS)"
          label="Repository:"
          emptyList="No repositories available"
          noneTitle="No Repository Selected"
          noneHint="Select a repository from the list to view details"
        />
      )
    case 'Languages':
      return (
        <ListTab
          list={data.languages}
          listTitle="LANGUAGES"
          detailTitle="LANGUAGE DETAILS (LAST 90 DAYS)"
          label="Language:"
          emptyList="No languages available"
          noneTitle="No Language Selected"
          noneHint="Select a language from the list to view details"
        />
      )
  }
}

export function AnalyticsScreen({ view }: { view: AnalyticsView }) {
  const palette = usePalette()
  const listTab = view.viewMode === 'Repositories' || view.viewMode === 'Languages'

  return (
    <ScreenFrame
      title={view.title}
      hints={
        <>
          <KeyHint keyLabel="← / h" label="Previous View" sendKey="left" color={palette.keyNavigation} testId="analytics-left" />
          <KeyHint keyLabel="→ / l" label="Next View" sendKey="right" color={palette.keyNavigation} testId="analytics-right" />
          <KeyHint keyLabel="↑ / k" label="Up" sendKey="up" color={palette.keyNavigation} disabled={!listTab} testId="analytics-up" />
          <KeyHint keyLabel="↓ / j" label="Down" sendKey="down" color={palette.keyNavigation} disabled={!listTab} testId="analytics-down" />
          <div style={{ flexGrow: 1 }} />
          <KeyHint keyLabel="r" label="Refresh" sendKey="r" color={palette.warning} testId="analytics-refresh" />
          <KeyHint keyLabel="ESC" label="Back" sendKey="escape" color={palette.error} testId="analytics-back" />
        </>
      }
    >
      <TabBar view={view} />
      <AnalyticsContent view={view} />
    </ScreenFrame>
  )
}
