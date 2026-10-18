---
name: split
description: Dividing a fixed total between people by a rule, with a chart. Load for splitting a bill, rent, or a cost by nights, usage, or evenly.
---

# Split

The bill first, so the total is visible. Then a button per rule that sets $mode, a bar chart of what each person owes, the exact table, and one line saying what the rule means. @Allocate divides in whole cents, so the shares always add up to the total. The chart is Svg built with @Each over @Range, with bars scaled to the largest share.

## OpenUI

```openui
$mode = "nights"
root = Card([header, bill, choose, chart, table, note])
header = CardHeader("Splitting Pine Lodge")
guests = [{"name":"Maya","nights":3},{"name":"Jon","nights":2},{"name":"Priya","nights":3},{"name":"Sam","nights":1}]
total = 640 * 3 + 180
bill = KVList([{label: "Three nights", value: @Format(640 * 3, "currency", 0)}, {label: "Cleaning", value: @Format(180, "currency", 0)}, {label: "Total", value: @Format(total, "currency", 0)}], "The bill")
choose = Buttons([Button("By nights", @Set($mode, "nights"), $mode == "nights" ? "primary" : "secondary", "normal", "small"), Button("Evenly", @Set($mode, "even"), $mode == "even" ? "primary" : "secondary", "normal", "small")])
shares = $mode == "even" ? @Allocate(total, [1, 1, 1, 1]) : @Allocate(total, guests.nights)
top = @Max(shares)
chart = Svg(@Each(@Range(0, @Count(guests)), "i", G([SvgText(guests[i].name, 0, i * 40 + 22, 14, "ink", "start", "medium"), Rect(64, i * 40 + 6, shares[i] / top * 176, 24, "info", null, null, null, 6), SvgText(@Format(shares[i], "currency", 0), 64 + shares[i] / top * 176 + 8, i * 40 + 23, 13, "muted")])), "0 0 320 160")
table = Table(["", "Nights", "Owes"], @Each(@Range(0, @Count(guests)), "i", [guests[i].name, guests[i].nights, @Format(shares[i], "currency", 2)]))
note = TextContent($mode == "nights" ? "Each night costs the same per person, cleaning included." : "Everyone pays the same, however long they stay.", "small")
```
