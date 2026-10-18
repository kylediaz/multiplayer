---
name: schedule
description: A schedule shown one period at a time. Load for games, classes, or events grouped by week or day.
---

# Schedule

One segmented bar, a tab per week. Inside a week, a group per day. A row's title is away at home, the subtitle is the time, and the trailing text is the channel. No buttons. The games are written in the source. schema.keys is empty. Copy this page.

```tsx
import { Card, CardHeader, ListBlock, ListItem, Tabs } from "ui"

const games = [
  { week: "1", day: "Thursday, Sep 10", time: "8:15 PM", away: "Falcons", home: "Cardinals", tv: "NBC" },
  { week: "1", day: "Sunday, Sep 13", time: "1:00 PM", away: "Commanders", home: "Ravens", tv: "FOX" },
  { week: "2", day: "Thursday, Sep 17", time: "8:15 PM", away: "Packers", home: "Saints", tv: "Prime" },
]

export default function App() {
  const weeks = ["1", "2"]
  return (
    <Card>
      <CardHeader title="2026 NFL Schedule" />
      <Tabs
        tabs={weeks.map((week) => {
          const weekGames = games.filter((game) => game.week === week)
          const days = [...new Set(weekGames.map((game) => game.day))]
          return {
            label: `Week ${week}`,
            children: days.map((day) => (
              <ListBlock key={day} header={day}>
                {weekGames.filter((game) => game.day === day).map((game) => (
                  <ListItem key={`${game.away}-${game.home}`} title={`${game.away} at ${game.home}`} subtitle={game.time} trailing={game.tv} />
                ))}
              </ListBlock>
            )),
          }
        })}
      />
    </Card>
  )
}
```

OpenUI is the same screen: CardHeader, then Tabs of ListBlock rows. No shared state.
