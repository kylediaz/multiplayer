---
name: brief
description: A researched recommendation with the evidence behind it. Load for summarizing listings, reviews, research, or search results into a pick.
---

# Brief

The verdict comes first, as a success callout that says which one and why in one line. Then a short table to compare, then a tab per option with its photos, numbers, description, and a link to the source. Say what is missing or suspicious with a warning callout where it applies, and end with what to do next. Only use image URLs that came from the source; with none, say so instead.

## OpenUI

```openui
root = Card([header, pick, compare, tabs, before])
header = CardHeader("Three West Village one-bedrooms")
pick = TextCallout("success", "Leroy Street is the pick", "The only one with outdoor space and a fireplace, and the laundry is in the unit.")
compare = Table(["","Leroy","Barrow","Morton"], [["Rent","$5,395","$5,495","$5,200"],["Outdoor","Balcony","None","None"],["Size","Not listed","Not listed","523 sq ft"],["Photos","Real","None","Staged"]])
tabs = Tabs([leroy, barrow, morton])
leroy = TabItem("Leroy", [leroyHero, leroyGrid, leroyFacts, leroyBody, leroyOpen])
leroyHero = ImageBlock("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=70&auto=format&fit=crop", "Leroy Street #1J")
leroyGrid = PhotoGrid([{"src":"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=70&auto=format&fit=crop"},{"src":"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=70&auto=format&fit=crop"}])
leroyFacts = KVList([{label: "Rent", value: @Format(5395, "currency", 0) + " a month"}, {label: "A year", value: @Format(5395 * 12, "currency", 0)}, {label: "Fee", value: "None"}])
leroyBody = Markdown("Renovated, with a private balcony, a fireplace, and a washer and dryer in the unit. Dishwasher, hardwood floors, high ceilings. Cats and dogs allowed.")
leroyOpen = Buttons([Button("Open the listing", @OpenUrl("https://www.renthop.com/listings/leroy-street/1-j/76926267"), "secondary")])
barrow = TabItem("Barrow", [barrowHero, barrowFacts, barrowBody, barrowOpen])
barrowHero = TextCallout("warning", "No photos", "The listing has none. Ask the agent before you go.")
barrowFacts = KVList([{label: "Rent", value: @Format(5495, "currency", 0) + " a month"}, {label: "A year", value: @Format(5495 * 12, "currency", 0)}, {label: "Fee", value: "None"}])
barrowBody = Markdown("Renovated, with exposed brick, in-unit laundry, a dishwasher, and stainless appliances. Near the A, C, E, B, D, F, and M.")
barrowOpen = Buttons([Button("Open the listing", @OpenUrl("https://www.renthop.com/listings/barrow-street/1w/77217078"), "secondary")])
morton = TabItem("Morton", [mortonHero, mortonFacts, mortonBody, mortonStaged, mortonOpen])
mortonHero = ImageBlock("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=70&auto=format&fit=crop", "Morton Street")
mortonFacts = KVList([{label: "Rent", value: @Format(5200, "currency", 0) + " a month"}, {label: "A year", value: @Format(5200 * 12, "currency", 0)}, {label: "Fee", value: "None"}])
mortonBody = Markdown("The cheapest of the three, with a washer and dryer in the unit, a marble bath, and a virtual doorman.")
mortonStaged = TextCallout("warning", "Staged photos", "These are of another unit in the building.")
mortonOpen = Buttons([Button("Open the listing", @OpenUrl("https://www.renthop.com/listings/morton-street/a/73435047"), "secondary")])
before = TextCallout("neutral", "Before you go", "None of the three lists a floor plan, so ask each agent for one. Confirm availability before applying.")
```
