import { useEffect, useRef, useState } from "react"
import type { ApplessRenderers, CartesianChartProps, PieChartProps, Renderer } from "./contract"

export interface ChartTheme {
  sep: string
  ink2: string
  chartPalette: string[]
}

export type ChartRenderers = Pick<ApplessRenderers, "BarChart" | "LineChart" | "AreaChart" | "PieChart" | "HorizontalBarChart">

interface SeriesNode {
  props?: { category?: string; values?: unknown[] }
}

interface SeriesData {
  category: string
  values: number[]
}

function readSeries(raw: unknown[] | undefined): SeriesData[] {
  return (raw ?? [])
    .map((series) => {
      const props = (series as SeriesNode)?.props
      if (!props) return null
      const values = (Array.isArray(props.values) ? props.values : []).map((value) =>
        typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0,
      )
      return { category: String(props.category ?? ""), values }
    })
    .filter((series): series is SeriesData => !!series && series.values.length > 0)
}

function niceMax(value: number): number {
  if (value <= 0) return 1
  const exp = Math.floor(Math.log10(value))
  const base = Math.pow(10, exp)
  const fraction = value / base
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
  return nice * base
}

function formatTick(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${+(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${+(value / 1_000).toFixed(1)}k`
  return `${+value.toFixed(1)}`
}

const CHART_HEIGHT = 170
const GUTTER_L = 36
const GUTTER_B = 20
const GUTTER_T = 8
const GUTTER_R = 8

function Legend({ series, theme }: { series: SeriesData[]; theme: ChartTheme }) {
  if (series.length <= 1) return null
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 12, rowGap: 3, marginTop: 4 }}>
      {series.map((item, index) => (
        <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: theme.chartPalette[index % theme.chartPalette.length] }} />
          <span style={{ fontSize: 10.5, color: theme.ink2 }}>{item.category}</span>
        </span>
      ))}
    </div>
  )
}

function AxisTitles({ xLabel, theme }: { xLabel?: string; theme: ChartTheme }) {
  if (!xLabel) return null
  return <div style={{ textAlign: "center", fontSize: 10, color: theme.ink2, marginTop: 2 }}>{xLabel}</div>
}

function YAxisTitle({ yLabel, theme }: { yLabel?: string; theme: ChartTheme }) {
  if (!yLabel) return null
  return <div style={{ fontSize: 10, color: theme.ink2, marginBottom: 2 }}>{yLabel}</div>
}

function ChartBox({ children, height = CHART_HEIGHT }: { children: (width: number) => React.ReactNode; height?: number }) {
  const [width, setWidth] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setWidth(element.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ width: "100%", height }}>
      {width > 40 ? children(width) : null}
    </div>
  )
}

function CartesianFrame({
  width,
  max,
  labels,
  theme,
  xCenters,
}: {
  width: number
  max: number
  labels: string[]
  theme: ChartTheme
  xCenters: number[]
}) {
  const plotH = CHART_HEIGHT - GUTTER_T - GUTTER_B
  const ticks = [0, 0.5, 1]
  const every = Math.max(1, Math.ceil(labels.length / Math.max(1, Math.floor(width / 44))))
  return (
    <g>
      {ticks.map((fraction, index) => {
        const y = GUTTER_T + plotH * (1 - fraction)
        return (
          <g key={index}>
            <path d={`M ${GUTTER_L} ${y} H ${width - GUTTER_R}`} stroke={theme.sep} strokeWidth={0.75} />
            <text x={GUTTER_L - 5} y={y + 3} fontSize={10} fill={theme.ink2} textAnchor="end">
              {formatTick(max * fraction)}
            </text>
          </g>
        )
      })}
      {labels.map((label, index) =>
        index % every === 0 ? (
          <text key={index} x={xCenters[index]} y={CHART_HEIGHT - 6} fontSize={10} fill={theme.ink2} textAnchor="middle">
            {label.length > 8 ? `${label.slice(0, 7)}…` : label}
          </text>
        ) : null,
      )}
    </g>
  )
}

export function createChartRenderers(useChartTheme: () => ChartTheme): ChartRenderers {
  function BarChartView({ props, horizontal }: { props: CartesianChartProps; horizontal?: boolean }) {
    const theme = useChartTheme()
    const labels = props.labels ?? []
    const series = readSeries(props.series)
    if (!labels.length || !series.length) return null
    const stacked = props.variant === "stacked"
    const maxRaw = stacked
      ? Math.max(...labels.map((_, index) => series.reduce((sum, item) => sum + (item.values[index] ?? 0), 0)))
      : Math.max(...series.flatMap((item) => item.values))
    const max = niceMax(maxRaw)

    if (horizontal) {
      const rowH = 26
      const height = GUTTER_T + labels.length * rowH + 24
      return (
        <div>
          <YAxisTitle yLabel={props.yLabel} theme={theme} />
          <ChartBox height={height}>
            {(width) => {
              const gutterL = 64
              const plotW = width - gutterL - GUTTER_R
              return (
                <svg width={width} height={height}>
                  {[0, 0.5, 1].map((fraction, index) => (
                    <g key={index}>
                      <path d={`M ${gutterL + plotW * fraction} ${GUTTER_T} V ${height - 20}`} stroke={theme.sep} strokeWidth={0.75} />
                      <text x={gutterL + plotW * fraction} y={height - 7} fontSize={10} fill={theme.ink2} textAnchor="middle">
                        {formatTick(max * fraction)}
                      </text>
                    </g>
                  ))}
                  {labels.map((label, index) => {
                    const y0 = GUTTER_T + index * rowH
                    const inner = stacked ? rowH - 10 : (rowH - 10) / series.length
                    let acc = 0
                    return (
                      <g key={index}>
                        <text x={gutterL - 6} y={y0 + rowH / 2 + 3} fontSize={10} fill={theme.ink2} textAnchor="end">
                          {label.length > 9 ? `${label.slice(0, 8)}…` : label}
                        </text>
                        {series.map((item, seriesIndex) => {
                          const value = item.values[index] ?? 0
                          const barWidth = (value / max) * plotW
                          const x = stacked ? gutterL + (acc / max) * plotW : gutterL
                          if (stacked) acc += value
                          const y = stacked ? y0 + 5 : y0 + 5 + seriesIndex * inner
                          return (
                            <rect
                              key={seriesIndex}
                              x={x}
                              y={y}
                              width={Math.max(0, barWidth)}
                              height={stacked ? rowH - 10 : Math.max(1, inner - 1)}
                              rx={3}
                              fill={theme.chartPalette[seriesIndex % theme.chartPalette.length]}
                            />
                          )
                        })}
                      </g>
                    )
                  })}
                </svg>
              )
            }}
          </ChartBox>
          <Legend series={series} theme={theme} />
          <AxisTitles xLabel={props.xLabel} theme={theme} />
        </div>
      )
    }

    return (
      <div>
        <YAxisTitle yLabel={props.yLabel} theme={theme} />
        <ChartBox>
          {(width) => {
            const plotW = width - GUTTER_L - GUTTER_R
            const plotH = CHART_HEIGHT - GUTTER_T - GUTTER_B
            const slot = plotW / labels.length
            const groupW = Math.min(slot * 0.66, 34)
            const xCenters = labels.map((_, index) => GUTTER_L + slot * index + slot / 2)
            return (
              <svg width={width} height={CHART_HEIGHT}>
                <CartesianFrame width={width} max={max} labels={labels} theme={theme} xCenters={xCenters} />
                {labels.map((_, index) => {
                  let acc = 0
                  const barW = stacked ? groupW : groupW / series.length
                  return (
                    <g key={index}>
                      {series.map((item, seriesIndex) => {
                        const value = item.values[index] ?? 0
                        const barHeight = (value / max) * plotH
                        const x = stacked ? xCenters[index] - groupW / 2 : xCenters[index] - groupW / 2 + seriesIndex * barW
                        const y = stacked ? GUTTER_T + plotH - barHeight - (acc / max) * plotH : GUTTER_T + plotH - barHeight
                        if (stacked) acc += value
                        return (
                          <rect
                            key={seriesIndex}
                            x={x}
                            y={y}
                            width={Math.max(1, barW - 1)}
                            height={Math.max(0, barHeight)}
                            rx={3}
                            fill={theme.chartPalette[seriesIndex % theme.chartPalette.length]}
                          />
                        )
                      })}
                    </g>
                  )
                })}
              </svg>
            )
          }}
        </ChartBox>
        <Legend series={series} theme={theme} />
        <AxisTitles xLabel={props.xLabel} theme={theme} />
      </div>
    )
  }

  function smoothPath(points: Array<[number, number]>): string {
    if (points.length < 2) return ""
    let path = `M ${points[0][0]} ${points[0][1]}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]
      const c1x = p1[0] + (p2[0] - p0[0]) / 6
      const c1y = p1[1] + (p2[1] - p0[1]) / 6
      const c2x = p2[0] - (p3[0] - p1[0]) / 6
      const c2y = p2[1] - (p3[1] - p1[1]) / 6
      path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
    }
    return path
  }

  function linePath(points: Array<[number, number]>, variant?: string): string {
    if (points.length < 2) return ""
    if (variant === "natural") return smoothPath(points)
    if (variant === "step") {
      let path = `M ${points[0][0]} ${points[0][1]}`
      for (let i = 1; i < points.length; i++) path += ` H ${points[i][0]} V ${points[i][1]}`
      return path
    }
    return `M ${points.map((point) => `${point[0]} ${point[1]}`).join(" L ")}`
  }

  function LineChartView({ props, area }: { props: CartesianChartProps; area?: boolean }) {
    const theme = useChartTheme()
    const labels = props.labels ?? []
    const series = readSeries(props.series)
    if (!labels.length || !series.length) return null
    const max = niceMax(Math.max(...series.flatMap((item) => item.values)))
    return (
      <div>
        <YAxisTitle yLabel={props.yLabel} theme={theme} />
        <ChartBox>
          {(width) => {
            const plotW = width - GUTTER_L - GUTTER_R
            const plotH = CHART_HEIGHT - GUTTER_T - GUTTER_B
            const count = Math.max(labels.length - 1, 1)
            const xCenters = labels.map((_, index) => GUTTER_L + (plotW * index) / count)
            return (
              <svg width={width} height={CHART_HEIGHT}>
                <CartesianFrame width={width} max={max} labels={labels} theme={theme} xCenters={xCenters} />
                {series.map((item, seriesIndex) => {
                  const points: Array<[number, number]> = item.values
                    .slice(0, labels.length)
                    .map((value, index) => [xCenters[index], GUTTER_T + plotH - (value / max) * plotH])
                  const color = theme.chartPalette[seriesIndex % theme.chartPalette.length]
                  const path = linePath(points, props.variant)
                  const baseline = GUTTER_T + plotH
                  return (
                    <g key={seriesIndex}>
                      {area && points.length >= 2 ? (
                        <path d={`${path} L ${points[points.length - 1][0]} ${baseline} L ${points[0][0]} ${baseline} Z`} fill={color} opacity={0.18} />
                      ) : null}
                      <path d={path} stroke={color} strokeWidth={2} fill="none" />
                      {points.length <= 16
                        ? points.map((point, index) => <circle key={index} cx={point[0]} cy={point[1]} r={2.4} fill={color} />)
                        : null}
                    </g>
                  )
                })}
              </svg>
            )
          }}
        </ChartBox>
        <Legend series={series} theme={theme} />
        <AxisTitles xLabel={props.xLabel} theme={theme} />
      </div>
    )
  }

  function arcPath(cx: number, cy: number, radius: number, start: number, end: number, inner: number): string {
    const large = end - start > Math.PI ? 1 : 0
    const x0 = cx + radius * Math.cos(start)
    const y0 = cy + radius * Math.sin(start)
    const x1 = cx + radius * Math.cos(end)
    const y1 = cy + radius * Math.sin(end)
    if (inner <= 0) return `M ${cx} ${cy} L ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1} Z`
    const xi0 = cx + inner * Math.cos(end)
    const yi0 = cy + inner * Math.sin(end)
    const xi1 = cx + inner * Math.cos(start)
    const yi1 = cy + inner * Math.sin(start)
    return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`
  }

  const BarChart: Renderer<CartesianChartProps> = ({ props }) => <BarChartView props={props} />
  const HorizontalBarChart: Renderer<CartesianChartProps> = ({ props }) => <BarChartView props={props} horizontal />
  const LineChart: Renderer<CartesianChartProps> = ({ props }) => <LineChartView props={props} />
  const AreaChart: Renderer<CartesianChartProps> = ({ props }) => <LineChartView props={props} area />
  const PieChart: Renderer<PieChartProps> = ({ props }) => {
    const theme = useChartTheme()
    const labels = props.labels ?? []
    const values = (props.values ?? []).map((value) => (typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0))
    const total = values.reduce((sum, value) => sum + value, 0)
    if (!total) return null
    const semi = props.appearance === "semiCircular"
    const height = semi ? 110 : CHART_HEIGHT
    return (
      <div>
        <ChartBox height={height}>
          {(width) => {
            const radius = semi ? Math.min(width / 2 - 8, 92) : Math.min(height / 2 - 8, 78)
            const inner = props.variant === "donut" ? radius * 0.6 : 0
            const cx = width / 2
            const cy = semi ? height - 6 : height / 2
            const start = semi ? Math.PI : -Math.PI / 2
            const span = semi ? Math.PI : Math.PI * 2
            let angle = start
            return (
              <svg width={width} height={height}>
                {values.map((value, index) => {
                  const startAngle = angle
                  const endAngle = angle + (value / total) * span
                  angle = endAngle
                  if (value <= 0) return null
                  return <path key={index} d={arcPath(cx, cy, radius, startAngle, endAngle - 0.008, inner)} fill={theme.chartPalette[index % theme.chartPalette.length]} />
                })}
              </svg>
            )
          }}
        </ChartBox>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 12, rowGap: 3, marginTop: 4 }}>
          {labels.slice(0, values.length).map((label, index) => (
            <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: theme.chartPalette[index % theme.chartPalette.length] }} />
              <span style={{ fontSize: 10.5, color: theme.ink2 }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    )
  }

  return { BarChart, LineChart, AreaChart, PieChart, HorizontalBarChart }
}
