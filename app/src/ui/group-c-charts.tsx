import { usePalette, withAlpha } from '../theme'
import { mutedColor } from './group-c-widgets'
import { Txt } from './kit'

const Y_AXIS_WIDTH = 56
const X_AXIS_HEIGHT = 22

/**
 * Line chart drawn as SVG markup. GPUI paints an svg as a single-color mask
 * tinted by `style.color`, so the area fill is a second, fainter svg layer.
 */
export function LineChart({
  values,
  yBounds,
  yLabels,
  xLabels,
  yTitle,
  width,
  height,
  color,
  testId,
}: {
  values: number[]
  yBounds: [number, number]
  yLabels: string[]
  xLabels: string[]
  yTitle: string
  width: number
  height: number
  color: string
  testId?: string
}) {
  const palette = usePalette()
  const plotWidth = Math.max(40, width - Y_AXIS_WIDTH)
  const plotHeight = Math.max(40, height - X_AXIS_HEIGHT)
  const [low, high] = yBounds
  const span = high - low || 1
  const step = values.length > 1 ? plotWidth / (values.length - 1) : 0
  const points = values.map((value, i) => {
    const x = values.length > 1 ? i * step : plotWidth / 2
    const y = plotHeight - ((value - low) / span) * plotHeight
    return [Number(x.toFixed(1)), Number(y.toFixed(1))] as const
  })
  const polyline = points.map(([x, y]) => `${x},${y}`).join(' ')
  const first = points[0]
  const last = points[points.length - 1]
  const area = first && last ? `M${first[0]},${plotHeight} L${polyline.replaceAll(' ', ' L')} L${last[0]},${plotHeight} Z` : ''
  const dots = points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff"/>`).join('')
  const lineSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${plotWidth + 8} ${plotHeight + 8}" width="${plotWidth + 8}" height="${plotHeight + 8}"><polyline points="${polyline}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>${dots}</svg>`
  const areaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${plotWidth + 8} ${plotHeight + 8}" width="${plotWidth + 8}" height="${plotHeight + 8}"><path d="${area}" fill="#fff"/></svg>`
  const gridSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${plotWidth} ${plotHeight}" width="${plotWidth}" height="${plotHeight}"><path d="M0,0.5 H${plotWidth} M0,${plotHeight / 2} H${plotWidth} M0,${plotHeight - 0.5} H${plotWidth}" stroke="#fff" stroke-width="1"/></svg>`

  return (
    <div testId={testId} style={{ display: 'flex', flexDirection: 'column', width, height }}>
      <div style={{ display: 'flex', flexDirection: 'row', height: plotHeight }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            width: Y_AXIS_WIDTH,
            paddingRight: 10,
            flexShrink: 0,
          }}
        >
          {[...yLabels].reverse().map((label, i) => (
            <Txt key={i} color={mutedColor(palette)} size={11} mono wrap={false}>
              {label}
            </Txt>
          ))}
        </div>
        <div style={{ position: 'relative', width: plotWidth, height: plotHeight }}>
          <svg source={gridSvg} style={{ position: 'absolute', top: 0, left: 0, width: plotWidth, height: plotHeight, color: withAlpha(palette.border, 0.6) }} />
          <svg
            source={areaSvg}
            style={{ position: 'absolute', top: -4, left: -4, width: plotWidth + 8, height: plotHeight + 8, color: withAlpha(color, 0.12) }}
          />
          <svg
            source={lineSvg}
            style={{ position: 'absolute', top: -4, left: -4, width: plotWidth + 8, height: plotHeight + 8, color }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', height: X_AXIS_HEIGHT, alignItems: 'flex-end' }}>
        <div style={{ width: Y_AXIS_WIDTH, flexShrink: 0 }}>
          <Txt color={mutedColor(palette)} size={10} weight={700} wrap={false}>
            {yTitle}
          </Txt>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: plotWidth }}>
          {xLabels.map((label, i) => (
            <Txt key={i} color={mutedColor(palette)} size={11} mono wrap={false}>
              {label}
            </Txt>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Vertical bars as flex divs; `labels` sit under the bars, counts above non-empty ones. */
export function BarChart({
  values,
  labels,
  height,
  color,
  testId,
}: {
  values: number[]
  labels: string[]
  height: number
  color: string
  testId?: string
}) {
  const palette = usePalette()
  const max = Math.max(1, ...values)
  const barArea = height - 36
  return (
    <div testId={testId} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 4, height }}>
      {values.map((value, i) => (
        <div
          key={i}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', flexGrow: 1, flexBasis: 0, minWidth: 0, gap: 3 }}
        >
          <Txt color={value > 0 ? palette.text : withAlpha(palette.text, 0)} size={10} mono wrap={false}>
            {String(value)}
          </Txt>
          <div
            style={{
              width: '100%',
              height: Math.max(2, Math.round((value / max) * barArea)),
              borderRadius: 3,
              backgroundColor: value > 0 ? color : withAlpha(palette.text, 0.08),
            }}
          />
          <Txt color={mutedColor(palette)} size={10} mono wrap={false}>
            {labels[i] ?? ''}
          </Txt>
        </div>
      ))}
    </div>
  )
}
