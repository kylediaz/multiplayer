---
name: heater
description: An explanation of how something works, with a diagram, the formula, and the code. Load for explaining a mechanism, an algorithm, a spec, or a concept.
---

# Heater

Explain by letting the reader poke the thing. Lead with one sentence of what it does, show it working, then give the rule exactly: the formula, then the code.

## React

React runs the real thing. The code simulates two hours of the room, and two sliders change the set point and the gap, so the reader watches the boiler cycle redraw. The chart is an inline svg: the band as a faint rectangle, the temperature as a polyline, and a strip along the bottom for when the boiler is on. The numbers it produces go in a KVList, and the rule itself in a pre. Nothing is shared, so schema.keys is empty.

```json
{ "keys": {} }
```

```tsx
import { useMemo, useState } from "react"
import { Card, CardHeader, KVList, TextContent } from "ui"

const OUTSIDE = 30
const LOSS = 0.012
const POWER = 0.75
const MINUTES = 120
const TICK = 0.25
const code = `function step(temp, set, gap, heating) {
  if (temp < set - gap / 2) return true
  if (temp > set + gap / 2) return false
  return heating
}`

function step(temp: number, set: number, gap: number, heating: boolean): boolean {
  if (temp < set - gap / 2) return true
  if (temp > set + gap / 2) return false
  return heating
}

function simulate(set: number, gap: number) {
  let temp = set
  let heating = false
  let starts = 0
  let coast = 0
  let longest = 0
  const points: { minute: number; temp: number; heating: boolean }[] = []
  for (let minute = 0; minute <= MINUTES; minute += TICK) {
    const next = step(temp, set, gap, heating)
    if (next && !heating) starts++
    coast = next ? 0 : coast + TICK
    longest = Math.max(longest, coast)
    heating = next
    points.push({ minute, temp, heating })
    temp += ((heating ? POWER : 0) - LOSS * (temp - OUTSIDE)) * TICK
  }
  return { points, startsPerHour: starts / (MINUTES / 60), longest }
}

function Range({ label, value, unit, min, max, step: by, onChange }: { label: string; value: number; unit: string; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="flex flex-col gap-2 px-0.5">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground tabular-nums">
          {value}
          {unit}
        </span>
      </span>
      <input type="range" className="w-full accent-primary" min={min} max={max} step={by} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

export default function App() {
  const [set, setSet] = useState(68)
  const [gap, setGap] = useState(2)
  const run = useMemo(() => simulate(set, gap), [set, gap])
  const width = 320
  const height = 150
  const x = (minute: number) => (minute / MINUTES) * width
  const y = (temp: number) => 10 + ((set + 4 - temp) / 8) * 110
  const line = run.points.map((point) => `${x(point.minute).toFixed(1)},${y(point.temp).toFixed(1)}`).join(" ")

  return (
    <Card>
      <CardHeader title="The cabin heater" />
      <TextContent text="Slide the set point and the gap. The boiler only starts below the band and only stops above it." style="small" />
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible rounded-2xl bg-muted">
        <rect x={0} y={y(set + gap / 2)} width={width} height={y(set - gap / 2) - y(set + gap / 2)} className="fill-foreground/10" />
        <polyline points={line} className="fill-none stroke-primary" strokeWidth={2} strokeLinejoin="round" />
        {run.points
          .filter((point) => point.heating)
          .map((point) => (
            <rect key={point.minute} x={x(point.minute)} y={height - 14} width={(TICK / MINUTES) * width + 0.3} height={6} className="fill-primary" />
          ))}
        <text x={8} y={height - 20} className="fill-muted-foreground text-[10px]">
          Boiler on
        </text>
        <text x={width - 8} y={height - 20} textAnchor="end" className="fill-muted-foreground text-[10px]">
          2 hours
        </text>
      </svg>
      <Range label="Set point" value={set} unit="°F" min={60} max={74} step={1} onChange={setSet} />
      <Range label="Gap" value={gap} unit="°F" min={0.5} max={6} step={0.5} onChange={setGap} />
      <KVList
        rows={[
          { label: "Band", value: `${set - gap / 2}°F to ${set + gap / 2}°F` },
          { label: "Starts an hour", value: run.startsPerHour.toFixed(1) },
          { label: "Longest wait for heat", value: `${Math.round(run.longest)} min` },
        ]}
      />
      <TextContent text="This is the whole rule. The boiler keeps doing what it was doing until the room leaves the band." />
      <pre className="m-0 overflow-x-auto rounded-2xl bg-muted px-4 py-3.5 font-mono text-[13px] leading-[1.6]">
        <code>{code}</code>
      </pre>
    </Card>
  )
}
```

## OpenUI

OpenUI draws a diagram that answers to buttons. The Svg is a track with the band shaded on it and a dot computed from $temp, red while the boiler runs. Colder and Warmer each run one Action: decide the boiler from the next temperature, then move the room. A callout switches on $heating. Then the rule in one Markdown block, with real math and a fenced block of code.

```openui
$temp = 68
$heating = false
root = Card([header, lede, sim, controls, status, body])
header = CardHeader("The cabin heater")
lede = TextContent("Nudge the room and watch the boiler hold its band.", "small")
sim = Svg([band, track, tick64, tick66, tick68, tick70, tick72, onLabel, offLabel, dot, reading], "0 0 320 110")
band = Rect(137, 34, 46, 42, "info", null, null, 0.12, 8)
track = Line(20, 55, 300, 55, "muted", 2)
tick64 = SvgText("64°", 67, 98, 11, "muted", "middle")
tick66 = SvgText("66°", 113, 98, 11, "muted", "middle")
tick68 = SvgText("68°", 160, 98, 11, "muted", "middle")
tick70 = SvgText("70°", 207, 98, 11, "muted", "middle")
tick72 = SvgText("72°", 253, 98, 11, "muted", "middle")
onLabel = SvgText("on", 137, 28, 10, "muted", "middle")
offLabel = SvgText("off", 183, 28, 10, "muted", "middle")
x = 20 + ($temp - 62) * 23.3333
dot = Circle(x, 55, 9, $heating ? "danger" : "ink")
reading = SvgText($temp + "°", x, 81, 12, "ink", "middle", "semibold")
controls = Buttons([colder, warmer])
colder = Button("Colder", Action([@Set($heating, $temp - 1 < 67 ? true : $temp - 1 > 69 ? false : $heating), @Set($temp, @Clamp($temp - 1, 62, 74))]), "secondary")
warmer = Button("Warmer", Action([@Set($heating, $temp + 1 < 67 ? true : $temp + 1 > 69 ? false : $heating), @Set($temp, @Clamp($temp + 1, 62, 74))]), "secondary")
status = $heating ? TextCallout("warning", "Boiler on", "It stays on until the room passes 69°F.") : TextCallout("neutral", "Boiler off", "It stays off until the room drops below 67°F.")
body = Markdown("The boiler at Pine Lodge short-cycles if it chases the set point. It doesn't. It holds a deadband and keeps doing what it was already doing.\n\nCall the set point $S$ and the gap $g$. Heat starts below the band and stops above it.\n\n$$\n\\mathrm{on}(T) = T < S - \\frac{g}{2}\n$$\n\n$$\n\\mathrm{off}(T) = T > S + \\frac{g}{2}\n$$\n\n```\nfunction step(temp, set, gap, heating) {\n  if (temp < set - gap / 2) return true\n  if (temp > set + gap / 2) return false\n  return heating\n}\n```\n\nThe coast back down takes about\n\n$$\nt = \\frac{C}{P}\\left(S + \\frac{g}{2} - T\\right)\n$$\n\nwhere $C$ is the heat the room holds and $P$ is how fast the boiler puts it back. A wider gap means fewer starts, and a longer wait.")
```
