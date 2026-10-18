---
name: tonight
description: One plan with a place and a time, laid out to act on. Load for a dinner reservation, an event, a meetup, or a booking confirmation.
---

# Tonight

A plan reads top to bottom: a photo of the place, the name, the time as the one heavy line, then the facts, a small map, the thread that made the plan, and the actions. The photo is a real URL. The map has one marker with an emoji. The actions do something real: directions open the maps app, and the phone number is a tel: link.

## OpenUI

```openui
root = Card([hero, header, when, facts, map, thread, actions])
hero = ImageBlock("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=70&auto=format&fit=crop", "Nopa, tonight")
header = CardHeader("Dinner at Nopa")
when = TextContent("7:30 PM, table for six", "large-heavy")
facts = KVList([{"label":"Where","value":"560 Divisadero St"},{"label":"Under","value":"Rajiv"},{"label":"Who","value":"Maya, Jon, Priya, Sam, Alex, Rajiv"}], "The table")
map = Map([nopa], false, null, 220)
nopa = MapMarker("Nopa", 37.7749, -122.4376, null, "🍽️")
thread = Bubbles([{"text":"Booked Nopa for 7:30, six of us","me":true,"time":"4:12 PM"},{"text":"amazing. pork chop is mine","me":false},{"text":"can we sit outside?","me":false},{"text":"Asked. Patio if it's open, inside if not","me":true}])
actions = Buttons([directions, call], "column")
directions = Button("Directions", @OpenUrl("https://maps.apple.com/?daddr=560+Divisadero+St,+San+Francisco"))
call = Button("Call Nopa", @OpenUrl("tel:+14158648643"), "secondary")
```
