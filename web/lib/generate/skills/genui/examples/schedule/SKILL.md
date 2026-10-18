---
name: schedule
description: A schedule shown one period at a time. Load for games, classes, shifts, or events grouped by week or day.
---

# Schedule

One segmented bar, a tab per week. Inside a week, a group per day. A row's title is away at home, the subtitle is the time, and the trailing text is the channel. No buttons. The games are written once as data and the screen is built from them.

## React

```json
{ "keys": {} }
```

```tsx
import { Card, CardHeader, ListBlock, ListItem, Tabs } from "ui"

const games = [
  { week: 1, day: "Thursday, Sep 10", time: "8:15 PM", away: "Falcons", home: "Cardinals", tv: "NBC" },
  { week: 1, day: "Sunday, Sep 13", time: "1:00 PM", away: "Commanders", home: "Ravens", tv: "FOX" },
  { week: 1, day: "Sunday, Sep 13", time: "4:25 PM", away: "Bears", home: "Rams", tv: "CBS" },
  { week: 2, day: "Thursday, Sep 17", time: "8:15 PM", away: "Packers", home: "Saints", tv: "Prime" },
  { week: 2, day: "Sunday, Sep 20", time: "1:00 PM", away: "Jets", home: "Bills", tv: "CBS" },
]

export default function App() {
  const weeks = [...new Set(games.map((game) => game.week))]
  return (
    <Card>
      <CardHeader title="2026 NFL schedule" />
      <Tabs
        tabs={weeks.map((week) => {
          const inWeek = games.filter((game) => game.week === week)
          const days = [...new Set(inWeek.map((game) => game.day))]
          return {
            label: `Week ${week}`,
            children: days.map((day) => (
              <ListBlock key={day} header={day}>
                {inWeek
                  .filter((game) => game.day === day)
                  .map((game) => (
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

## OpenUI

The days are their own small list so each tab can group by day: @Each over the days in a week, and @Filter for the games on each day.

```openui
root = Card([header, weeks])
header = CardHeader("2026 NFL schedule")
games = [{"day":"Thursday, Sep 10","time":"8:15 PM","away":"Falcons","home":"Cardinals","tv":"NBC"},{"day":"Sunday, Sep 13","time":"1:00 PM","away":"Commanders","home":"Ravens","tv":"FOX"},{"day":"Sunday, Sep 13","time":"4:25 PM","away":"Bears","home":"Rams","tv":"CBS"},{"day":"Thursday, Sep 17","time":"8:15 PM","away":"Packers","home":"Saints","tv":"Prime"},{"day":"Sunday, Sep 20","time":"1:00 PM","away":"Jets","home":"Bills","tv":"CBS"}]
days = [{"week":1,"day":"Thursday, Sep 10"},{"week":1,"day":"Sunday, Sep 13"},{"week":2,"day":"Thursday, Sep 17"},{"week":2,"day":"Sunday, Sep 20"}]
weeks = Tabs(@Each([1, 2], "w", TabItem("Week " + w, @Each(@Filter(days, "week", "==", w), "d", ListBlock(@Each(@Filter(games, "day", "==", d.day), "g", ListItem(g.away + " at " + g.home, g.time, null, g.tv)), d.day)))))
```
