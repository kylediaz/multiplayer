---
name: openui
description: How to write the OpenUI program, including state, actions, functions, drawing, and the component library. Load this when the app is OpenUI.
---

# OpenUI

submit takes this shape.

{
  "title": string,
  "source": "<openui-lang program>"
}

When submit also asks for lang, set it to "openui". When it asks for schema, schema is { "keys": {} }.

## What OpenUI is for

A screen one person reads and plays with on their own phone: a place on a map, a route, photos, a drawing that moves, math and code, numbers worked out for them, a game. Nothing is shared and nothing is saved. There are no text fields. When people add to it, vote, or reply together, the app is React.

Use what the library has. A place gets a Map. A trip gets a route. A meal or a home gets a photo when you have a real URL. A mechanism gets an Svg that moves. A formula is Markdown math. A split, a total, or a conversion is a function, never a number you worked out yourself. Give the person something to tap that changes the screen: a choice, a stepper, a stop on the route.

## Data once, then @Each

Write the records once, as a list of objects. Render rows, markers, bars, and table rows from that list with @Each, and take totals from it too.

```openui
trip = [{label: "Home", place: "San Francisco", lat: 37.7599, lng: -122.4148, miles: 0, icon: "🏠"}, {label: "Pine Lodge", place: "Tahoe Vista", lat: 39.242, lng: -120.028, miles: 198, icon: "🏡"}]
map = Map(@Each(trip, "s", MapMarker(s.label, s.lat, s.lng, null, s.icon)), true)
stops = ListBlock(@Each(trip, "s", ListItem(s.label, s.place, null, s.miles + " mi")), "Stops")
total = KVList([{label: "Distance", value: @Format(@Sum(trip.miles), "number", 0) + " mi"}])
```

The loop variable exists only inside the template, so write the template inline. `trip.miles` is the list of every row's miles. Loop over `@Range(0, @Count(steps))` when you need the index, as in numbered steps: `ListItem(steps[n], null, null, @Pad(n + 1, 2))`. Group with @Filter: a ListBlock per day holding `@Each(@Filter(games, "day", "==", d.day), ...)`.

## State

Declare state at the top with `$name = value`. Buttons change it with @Set, and everything that reads it updates.

- A choice is a row of Buttons. The chosen one is fill and the rest are secondary: `Button(c.name, @Set($cabin, c.name), $cabin == c.name ? "fill" : "secondary", "normal", "small")`. primary is the cornflower bar for the one action a screen is for, at most once.
- A stepper is two Buttons: `Button("More", @Set($serves, @Clamp($serves + 2, 2, 16)), "secondary")`.
- A row that selects is a ListItem with an action: `ListItem(s.label, s.place, null, null, @Set($stop, s.label))`.
- The detail is `picked = @Find(options, "name", $cabin)`, then `picked.photo` and `picked.night`.
- Map's selected binds both ways: `Map(markers, false, $cabin)`. Tapping a pin sets $cabin.
- A component can switch: `status = $on ? TextCallout("warning", "Boiler on") : TextCallout("neutral", "Boiler off")`.
- Action([...]) runs its steps in order, and each step reads what the steps before it set.
- Toggle flips on its own and binds nothing. Use it for a checklist someone ticks for themself.

## Numbers

Compute everything: @Sum, @Count, @Format(value, "currency", 0), @Convert(miles, "mi", "km"), @Allocate(total, weights), @Duration(seconds), @Plural(n, "stop"), @Percent, and @Clamp. Scale a recipe with `amount * $serves / 6`. Never type a total, a share, or a conversion.

## Drawing

Svg is for charts, mechanisms, and anything that moves with state, because its shapes take expressions. Keep the viewBox about 320 wide so text stays in scale. Colors are "ink", "muted", "surface", "info" (navy), "success" (pine), "warning" (marigold), "danger", "accent" (cornflower), and the fills "lavender", "pistachio", and "rose". Navy is the mark; cornflower is only for the one thing to tap.

A bar chart from two lists:

```openui
top = @Max(shares)
chart = Svg(@Each(@Range(0, @Count(guests)), "i", G([SvgText(guests[i].name, 0, i * 40 + 22, 14, "ink", "start", "medium"), Rect(64, i * 40 + 6, shares[i] / top * 176, 24, "info", null, null, null, 6), SvgText(@Format(shares[i], "currency", 0), 72 + shares[i] / top * 176, i * 40 + 23, 13, "muted")])), "0 0 320 160")
```

A dot that moves with state: `dot = Circle(20 + ($temp - 62) * 23.33, 55, 9, $heating ? "danger" : "ink")`.

## Media, maps, and content

- ImageBlock can come before CardHeader for a place or a meal, and PhotoGrid holds the rest of the photos. Only use an image URL you were given or know exists. Otherwise leave images out, and say so in a TextCallout when the missing photos matter.
- A MapMarker icon is one emoji. route draws the road in marker order, for a trip. A single place is one marker at a height of about 220.
- Markdown holds prose, $inline$ and $$display$$ math, fenced code, and tables. A technical explanation is one Markdown block.
- Table is a grid of a few short columns. Keep headers and cells short so four columns fit a phone. Cells read inline Markdown.
- Bubbles shows a thread when the conversation is the point.
- Tabs gives each option its own tab when each one needs photos and paragraphs.
- HtmlView is a sandboxed page with its own script, for a canvas, an animation, or a game. It cannot see the theme, so read the text color with getComputedStyle(document.body).color and paint with it at different opacities. A button inside it is full width, with a 16px radius, background CanvasText, and color Canvas.

## Buttons

A Button does something on the spot: @Set to change the screen, or @OpenUrl for a link, directions, or a phone number (tel:). There is no assistant to send a message to, so never use @ToAssistant, and never leave a Button without an action.

The component library follows.
