"use client"

import { Bar, CartesianGrid, Cell, Line, Area, Pie, XAxis, YAxis, AreaChart as ReAreaChart, BarChart as ReBarChart, LineChart as ReLineChart, PieChart as RePieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

export type ChartSeries = { name: string; data: number[] }
export type ChartSlice = { label: string; value: number }

function chartConfig(series: { name: string }[]): ChartConfig {
  return Object.fromEntries(series.map((item, index) => [`s${index}`, { label: item.name, color: COLORS[index % COLORS.length] }]))
}

function chartRows(categories: string[], series: ChartSeries[]) {
  return categories.map((category, index) => {
    const row: Record<string, string | number> = { category }
    series.forEach((item, seriesIndex) => {
      row[`s${seriesIndex}`] = item.data[index] ?? 0
    })
    return row
  })
}

export type BarChartProps = {
  categories: string[]
  series: ChartSeries[]
  height?: number
  stacked?: boolean
  horizontal?: boolean
  className?: string
}

export function BarChart({ categories, series, height = 240, stacked, horizontal, className }: BarChartProps) {
  if (!categories.length || !series.length) return null
  const data = chartRows(categories, series)
  return (
    <ChartContainer config={chartConfig(series)} className={className} style={{ height, aspectRatio: "auto" }}>
      <ReBarChart data={data} layout={horizontal ? "vertical" : "horizontal"}>
        <CartesianGrid vertical={false} />
        {horizontal ? (
          <>
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} width={96} />
          </>
        ) : (
          <>
            <XAxis dataKey="category" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={32} />
          </>
        )}
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((item, index) => (
          <Bar key={item.name} dataKey={`s${index}`} fill={`var(--color-s${index})`} stackId={stacked ? "stack" : undefined} radius={4} />
        ))}
      </ReBarChart>
    </ChartContainer>
  )
}

export type LineChartProps = {
  categories: string[]
  series: ChartSeries[]
  height?: number
  className?: string
}

export function LineChart({ categories, series, height = 240, className }: LineChartProps) {
  if (!categories.length || !series.length) return null
  return (
    <ChartContainer config={chartConfig(series)} className={className} style={{ height, aspectRatio: "auto" }}>
      <ReLineChart data={chartRows(categories, series)}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="category" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((item, index) => (
          <Line key={item.name} type="monotone" dataKey={`s${index}`} stroke={`var(--color-s${index})`} strokeWidth={2} dot={false} />
        ))}
      </ReLineChart>
    </ChartContainer>
  )
}

export type AreaChartProps = LineChartProps

export function AreaChart({ categories, series, height = 240, className }: AreaChartProps) {
  if (!categories.length || !series.length) return null
  return (
    <ChartContainer config={chartConfig(series)} className={className} style={{ height, aspectRatio: "auto" }}>
      <ReAreaChart data={chartRows(categories, series)}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="category" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((item, index) => (
          <Area key={item.name} type="monotone" dataKey={`s${index}`} stroke={`var(--color-s${index})`} fill={`var(--color-s${index})`} fillOpacity={0.2} />
        ))}
      </ReAreaChart>
    </ChartContainer>
  )
}

export type PieChartProps = {
  data: ChartSlice[]
  donut?: boolean
  className?: string
}

export function PieChart({ data, donut, className }: PieChartProps) {
  if (!data.length) return null
  const config = Object.fromEntries(data.map((item, index) => [`s${index}`, { label: item.label, color: COLORS[index % COLORS.length] }]))
  const slices = data.map((item, index) => ({ name: item.label, value: item.value, fill: COLORS[index % COLORS.length] }))
  return (
    <ChartContainer config={config} className={className} style={{ height: 240, aspectRatio: "auto" }}>
      <RePieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
        <Pie data={slices} dataKey="value" nameKey="name" innerRadius={donut ? 52 : 0}>
          {slices.map((slice) => (
            <Cell key={slice.name} fill={slice.fill} />
          ))}
        </Pie>
      </RePieChart>
    </ChartContainer>
  )
}
