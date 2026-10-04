"use client"

import { useState, type CSSProperties, type JSX } from "react"
import { mergeStyle } from "./primitives"
import { canvasTypography, toneColor, useHostTheme, type ChartPalette } from "./theme"

export type ChartTone = "success" | "danger" | "warning" | "info" | "neutral"
export type ChartDataPoint = { label: string; value: number }
export type ChartSeries = { name: string; data: number[]; tone?: ChartTone }
export type ChartReferenceLine = { value: number; label?: string; tone?: ChartTone }

type ValueAxisProps = {
  beginAtZero?: boolean
  yMin?: number
  yMax?: number
  referenceLines?: ChartReferenceLine[]
}

export type BarChartProps = ValueAxisProps & {
  categories: string[]
  series: ChartSeries[]
  height?: number
  stacked?: boolean
  horizontal?: boolean
  normalized?: boolean
  valueSuffix?: string
  valuePrefix?: string
  showValues?: boolean
  style?: CSSProperties
}

export type LineChartProps = ValueAxisProps & {
  categories: string[]
  series: ChartSeries[]
  height?: number
  fill?: boolean
  valueSuffix?: string
  valuePrefix?: string
  showValues?: boolean
  showHoverGuide?: boolean
  style?: CSSProperties
}

export type PieChartProps = {
  data: Array<ChartDataPoint & { tone?: ChartTone }>
  size?: number
  donut?: boolean
  style?: CSSProperties
}

export function BarChart(props: BarChartProps): JSX.Element {
  const { categories, series, height = 280, stacked, horizontal, normalized, valueSuffix = "", valuePrefix = "", showValues, style } = props
  const theme = useHostTheme()
  const stack = Boolean(stacked || normalized)
  const colors = series.map((item, index) => seriesColor(item, index, series.length, theme.chart.palette, theme.chart.sequence))
  const values = normalized ? normalize(series, categories.length) : series.map((item) => item.data)
  const domain = axisDomain(values.flat(), props, stack)
  const labels = showValues ?? (series.length === 1 && categories.length <= 8 && !stack)
  const pad = { left: horizontal ? 120 : 36, right: 12, top: 12, bottom: horizontal ? 28 : 48 }
  const width = 640
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const span = domain.max - domain.min || 1
  const scale = (value: number) => (value - domain.min) / span

  return (
    <figure style={mergeStyle({ margin: 0 }, style)}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img">
        {categories.map((category, index) => {
          const band = (horizontal ? plotH : plotW) / categories.length
          const origin = horizontal ? pad.left : pad.left
          return series.map((_, seriesIndex) => {
            const raw = values[seriesIndex]?.[index] ?? 0
            const start = stack ? values.slice(0, seriesIndex).reduce((sum, column) => sum + (column[index] ?? 0), 0) : 0
            const size = Math.abs(scale(start + raw) - scale(start))
            const offset = scale(Math.min(start, start + raw))
            const thickness = stack ? band * 0.62 : (band * 0.7) / series.length
            const slot = stack ? band / 2 - thickness / 2 : band * 0.15 + seriesIndex * thickness
            const fill = series.length === 1 && !series[0]?.tone ? theme.chart.sequence[index % theme.chart.sequence.length] : colors[seriesIndex]
            if (horizontal) {
              const y = pad.top + index * band + slot
              const x = origin + offset * plotW
              const w = Math.max(size * plotW, 0)
              return <rect key={`${index}-${seriesIndex}`} x={x} y={y} width={w} height={thickness} fill={fill} />
            }
            const x = pad.left + index * band + slot
            const h = Math.max(size * plotH, 0)
            const y = pad.top + plotH - offset * plotH - h
            return <rect key={`${index}-${seriesIndex}`} x={x} y={y} width={thickness} height={h} fill={fill} />
          })
        })}
        {labels && categories.map((category, index) => {
          const raw = series[0]?.data[index] ?? 0
          const text = `${normalized ? "" : valuePrefix}${formatNumber(normalized ? (values[0]?.[index] ?? 0) * 100 : raw)}${normalized ? "%" : valueSuffix}`
          if (horizontal) {
            const y = pad.top + (index + 0.5) * (plotH / categories.length)
            const x = pad.left + scale(raw) * plotW + 4
            return <text key={category} x={x} y={y} fill={theme.text.secondary} fontSize={11} dominantBaseline="middle">{text}</text>
          }
          const x = pad.left + (index + 0.5) * (plotW / categories.length)
          const y = pad.top + plotH - scale(raw) * plotH - 4
          return <text key={category} x={x} y={y} fill={theme.text.secondary} fontSize={11} textAnchor="middle">{text}</text>
        })}
        {categories.map((category, index) => {
          if (horizontal) {
            const y = pad.top + (index + 0.5) * (plotH / categories.length)
            return <text key={category} x={pad.left - 8} y={y} fill={theme.text.tertiary} fontSize={11} textAnchor="end" dominantBaseline="middle">{category}</text>
          }
          const x = pad.left + (index + 0.5) * (plotW / categories.length)
          return <text key={category} x={x} y={height - 16} fill={theme.text.tertiary} fontSize={11} textAnchor="middle">{category}</text>
        })}
        {(props.referenceLines ?? []).map((line) => {
          const color = line.tone ? toneColor[line.tone] : theme.text.quaternary
          const at = scale(line.value)
          if (horizontal) {
            const x = pad.left + at * plotW
            return <line key={line.value} x1={x} x2={x} y1={pad.top} y2={pad.top + plotH} stroke={color} strokeDasharray="4 3" />
          }
          const y = pad.top + plotH - at * plotH
          return <line key={line.value} x1={pad.left} x2={pad.left + plotW} y1={y} y2={y} stroke={color} strokeDasharray="4 3" />
        })}
      </svg>
      {series.length > 1 && <Legend names={series.map((item) => item.name)} colors={colors} />}
    </figure>
  )
}

export function LineChart(props: LineChartProps): JSX.Element {
  const { categories, series, height = 280, fill, valueSuffix = "", valuePrefix = "", showValues, showHoverGuide = true, style } = props
  const theme = useHostTheme()
  const [hover, setHover] = useState<number | null>(null)
  const colors = series.map((item, index) => seriesColor(item, index, series.length, theme.chart.palette, theme.chart.sequence))
  const domain = axisDomain(series.flatMap((item) => item.data), props, false)
  const pad = { left: 36, right: 12, top: 16, bottom: 36 }
  const width = 640
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const span = domain.max - domain.min || 1
  const xAt = (index: number) => pad.left + (categories.length <= 1 ? plotW / 2 : (index / (categories.length - 1)) * plotW)
  const yAt = (value: number) => pad.top + plotH - ((value - domain.min) / span) * plotH

  return (
    <figure style={mergeStyle({ margin: 0 }, style)} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img">
        {series.map((item, seriesIndex) => {
          const points = item.data.map((value, index) => `${xAt(index)},${yAt(value)}`).join(" ")
          const area = `${pad.left},${pad.top + plotH} ${points} ${xAt(item.data.length - 1)},${pad.top + plotH}`
          return (
            <g key={item.name}>
              {fill && <polygon points={area} fill={colors[seriesIndex]} opacity={0.18} />}
              <polyline points={points} fill="none" stroke={colors[seriesIndex]} strokeWidth={1.5} />
              {item.data.map((value, index) => (
                <g key={index}>
                  <circle cx={xAt(index)} cy={yAt(value)} r={2.5} fill={colors[seriesIndex]} />
                  {showValues && categories.length <= 20 && (
                    <text x={xAt(index)} y={yAt(value) - 8} fill={theme.text.secondary} fontSize={11} textAnchor="middle">
                      {valuePrefix}{formatNumber(value)}{valueSuffix}
                    </text>
                  )}
                </g>
              ))}
            </g>
          )
        })}
        {categories.map((category, index) => (
          <text key={category} x={xAt(index)} y={height - 12} fill={theme.text.tertiary} fontSize={11} textAnchor="middle">{category}</text>
        ))}
        {showHoverGuide && hover !== null && (
          <line x1={xAt(hover)} x2={xAt(hover)} y1={pad.top} y2={pad.top + plotH} stroke={theme.stroke.secondary} />
        )}
        {categories.map((_, index) => (
          <rect key={index} x={xAt(index) - plotW / Math.max(categories.length, 1) / 2} y={pad.top} width={plotW / Math.max(categories.length, 1)} height={plotH} fill="transparent" onMouseEnter={() => setHover(index)} />
        ))}
      </svg>
      {series.length > 1 && <Legend names={series.map((item) => item.name)} colors={colors} />}
      {hover !== null && (
        <figcaption style={{ ...canvasTypography.small, color: theme.text.secondary }}>
          {categories[hover]}
          {series.map((item) => ` · ${item.name} ${valuePrefix}${formatNumber(item.data[hover] ?? 0)}${valueSuffix}`)}
        </figcaption>
      )}
    </figure>
  )
}

export function PieChart({ data, size = 200, donut, style }: PieChartProps): JSX.Element {
  const theme = useHostTheme()
  const total = data.reduce((sum, point) => sum + Math.max(0, point.value), 0) || 1
  const radius = size / 2 - 8
  const center = size / 2
  const slices = data.map((point, index) => {
    const sweep = (Math.max(0, point.value) / total) * Math.PI * 2
    const start = data.slice(0, index).reduce((sum, item) => sum + (Math.max(0, item.value) / total) * Math.PI * 2, -Math.PI / 2)
    const color = point.tone ? toneColor[point.tone] : theme.chart.sequence[index % theme.chart.sequence.length]
    return { ...point, start, end: start + sweep, color }
  })
  return (
    <figure style={mergeStyle({ margin: 0, display: "flex", gap: 16, alignItems: "center" }, style)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        {slices.map((slice) => (
          <path key={slice.label} d={wedge(center, center, radius, slice.start, slice.end, donut ? radius * 0.62 : 0)} fill={slice.color} />
        ))}
        {donut && (
          <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" fill={theme.text.primary} fontSize={16} fontWeight={590}>
            {formatNumber(data.reduce((sum, point) => sum + point.value, 0))}
          </text>
        )}
      </svg>
      <Legend names={slices.map((slice) => slice.label)} colors={slices.map((slice) => slice.color)} />
    </figure>
  )
}

function Legend({ names, colors }: { names: string[]; colors: string[] }) {
  const theme = useHostTheme()
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, ...canvasTypography.small, color: theme.text.secondary }}>
      {names.map((name, index) => (
        <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, background: colors[index] }} />
          {name}
        </span>
      ))}
    </div>
  )
}

function seriesColor(series: ChartSeries, index: number, count: number, palette: ChartPalette, sequence: readonly string[]) {
  if (series.tone) {
    if (series.tone === "success") return palette.green
    if (series.tone === "danger") return palette.darkAmber
    if (series.tone === "warning") return palette.goldenYellow
    if (series.tone === "info") return palette.blue
    return palette.muted
  }
  if (count === 1) return sequence[index % sequence.length]
  return sequence[index % sequence.length]
}

function normalize(series: ChartSeries[], count: number): number[][] {
  return series.map((item) =>
    item.data.map((value, index) => {
      const total = series.reduce((sum, entry) => sum + Math.max(0, entry.data[index] ?? 0), 0)
      return total === 0 ? 0 : Math.max(0, value) / total
    }).slice(0, count),
  )
}

function axisDomain(values: number[], props: ValueAxisProps, stacked: boolean) {
  const finite = values.filter((value) => Number.isFinite(value))
  const dataMin = Math.min(0, ...finite)
  const dataMax = Math.max(0, ...finite, ...(props.referenceLines ?? []).map((line) => line.value))
  if (stacked) return { min: 0, max: Math.max(dataMax, 1) }
  const min = props.yMin ?? (props.beginAtZero === false ? Math.min(...finite) : Math.min(0, dataMin))
  const max = props.yMax ?? dataMax
  return { min, max: max === min ? min + 1 : max }
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0"
  if (Math.abs(value) >= 100) return String(Math.round(value))
  return String(Math.round(value * 10) / 10)
}

function wedge(cx: number, cy: number, radius: number, start: number, end: number, inner: number) {
  const point = (angle: number, r: number) => `${cx + Math.cos(angle) * r} ${cy + Math.sin(angle) * r}`
  const large = end - start > Math.PI ? 1 : 0
  if (inner <= 0) return `M ${cx} ${cy} L ${point(start, radius)} A ${radius} ${radius} 0 ${large} 1 ${point(end, radius)} Z`
  return `M ${point(start, radius)} A ${radius} ${radius} 0 ${large} 1 ${point(end, radius)} L ${point(end, inner)} A ${inner} ${inner} 0 ${large} 0 ${point(start, inner)} Z`
}
