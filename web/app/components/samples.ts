export type ComponentSample = {
  group: string
  name: string
  description: string
  source: string
  minHeight?: number
}

function q(value: string): string {
  return JSON.stringify(value)
}

function call(name: string, component: string, args: readonly string[] = []): string {
  return `${name} = ${component}(${args.join(", ")})`
}

function screen(children: readonly string[], statements: readonly string[]): string {
  return [call("root", "Card", [`[${children.join(", ")}]`]), ...statements].join("\n")
}

function obj(fields: Record<string, string | boolean>): string {
  const body = Object.entries(fields)
    .map(([key, value]) => `${key}: ${typeof value === "string" ? q(value) : String(value)}`)
    .join(", ")
  return `{ ${body} }`
}

function swatch(fill: string, label: string, width = 800, height = 450): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${fill}"/><text x="50%" y="50%" fill="#fff" font-family="sans-serif" font-size="42" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function image(fill: string, label: string, width?: number, height?: number): string {
  return obj({ src: swatch(fill, label, width, height), alt: label })
}

const markdown = [
  "## Saturday market",
  "",
  "A short note with **bold**, *italic*, ~~struck~~, and `code`.",
  "",
  "- Peaches",
  "- Tomatoes",
  "- A loaf, if they have one",
  "",
  "> Come early. The good fruit is gone by ten.",
  "",
  "[Hours and the map](https://example.com)",
  "",
  "---",
  "",
  "```",
  "open at 8",
  "```",
].join("\n")

const html = [
  `<div style="padding:20px">`,
  `<p style="margin:0 0 12px;font-size:15px">Sandboxed page. The count stays in this frame.</p>`,
  `<button style="border:0;border-radius:16px;background:#111;color:#fff;font:600 15px/1 sans-serif;padding:12px 16px" onclick="var n=Number(this.dataset.n||0)+1;this.dataset.n=n;this.textContent='Taps: '+n">Taps: 0</button>`,
  `</div>`,
].join("")

const drawing = screen(
  ["drawing"],
  [
    call("drawing", "Svg", ["[ground, node, letter, link, orbit, orbitLetter, curve, tip, spark, badge]", q("0 0 300 180")]),
    call("ground", "Rect", ["0", "0", "300", "180", q("surface")]),
    call("node", "Circle", ["54", "64", "26", q("ink")]),
    call("letter", "SvgText", [q("A"), "54", "69", "16", q("canvas"), q("middle"), q("semibold")]),
    call("link", "Line", ["80", "64", "118", "64", q("muted"), "2"]),
    call("orbit", "Ellipse", ["156", "64", "32", "20", q("chart3")]),
    call("orbitLetter", "SvgText", [q("B"), "156", "69", "16", q("canvas"), q("middle"), q("semibold")]),
    call("curve", "Path", [q("M 188 64 C 214 64 214 36 242 36"), "null", q("ink"), "2"]),
    call("tip", "Polygon", [q("248,24 266,48 230,48"), q("danger")]),
    call("spark", "Polyline", [q("36,140 72,118 108,136 150,112 196,132"), q("muted"), "2"]),
    call("badge", "G", ["[badgeShape, badgeLabel]", q("rotate(-8 248 132)")]),
    call("badgeShape", "Rect", ["212", "114", "72", "36", q("ink"), "null", "null", "null", "8"]),
    call("badgeLabel", "SvgText", [q("G"), "248", "137", "14", q("canvas"), q("middle"), q("semibold")]),
  ],
)

function shape(component: string, args: readonly string[], viewBox = "0 0 120 80"): string {
  return screen(["drawing"], [call("drawing", "Svg", ["[shape]", q(viewBox), "200"]), call("shape", component, args)])
}

export const samples: ComponentSample[] = [
  {
    group: "Structure",
    name: "Card",
    description: "Root of every screen. Children stack vertically.",
    source: screen(
      ["title", "body", "note"],
      [
        call("title", "TextContent", [q("Saturday dinner"), q("large-heavy")]),
        call("body", "TextContent", [q("A window table for six, at 7:30.")]),
        call("note", "TextCallout", [q("info"), q("Ask for the corner"), q("It is the quieter one.")]),
      ],
    ),
  },
  {
    group: "Structure",
    name: "CardHeader",
    description: "Screen header. Large title.",
    source: screen(["header"], [call("header", "CardHeader", [q("Saturday dinner")])]),
  },
  {
    group: "Structure",
    name: "TextContent",
    description: "Text block. small and default for body copy, large for a lead, and the heavy styles for titles.",
    source: screen(
      ["small", "body", "large", "label", "title"],
      [
        call("small", "TextContent", [q("Small. A footnote under the screen."), q("small")]),
        call("body", "TextContent", [q("Default. The body size for a sentence or two.")]),
        call("large", "TextContent", [q("Large. A line you want read first."), q("large")]),
        call("label", "TextContent", [q("Small heavy. A short label."), q("small-heavy")]),
        call("title", "TextContent", [q("Large heavy. A section title."), q("large-heavy")]),
      ],
    ),
  },
  {
    group: "Structure",
    name: "TextCallout",
    description: "Banner for an alert, tip, or status.",
    source: screen(
      ["neutral", "info", "success", "warning", "danger"],
      [
        call("neutral", "TextCallout", [q("neutral"), q("Neutral"), q("A note that does not change the plan.")]),
        call("info", "TextCallout", [q("info"), q("Info"), q("The table is under Rivera.")]),
        call("success", "TextCallout", [q("success"), q("Success"), q("The reservation is confirmed.")]),
        call("warning", "TextCallout", [q("warning"), q("Warning"), q("The kitchen closes at nine.")]),
        call("danger", "TextCallout", [q("danger"), q("Danger"), q("This time is no longer available.")]),
      ],
    ),
  },
  {
    group: "Lists",
    name: "ListBlock",
    description: "Grouped list. The main way to show a collection of rows.",
    source: screen(
      ["list"],
      [
        call("list", "ListBlock", ["[eggs, bread, butter]", q("To get")]),
        call("eggs", "ListItem", [q("Eggs"), q("A dozen"), "null", q("$8")]),
        call("bread", "ListItem", [q("Sourdough"), q("One loaf"), "null", q("$9")]),
        call("butter", "ListItem", [q("Butter"), "null", "null", q("$6")]),
      ],
    ),
  },
  {
    group: "Lists",
    name: "ListItem",
    description: "A row with a title, and optional subtitle, icon or thumbnail, trailing value, and action.",
    source: screen(
      ["list"],
      [
        call("list", "ListBlock", ["[wifi, cabin, battery, settings]"]),
        call("wifi", "ListItem", [q("Wi-Fi"), q("Connected"), q("wifi")]),
        call("cabin", "ListItem", [q("North cabin"), q("Pine and cedar"), image("#3d5a4c", "Cabin", 200, 200)]),
        call("battery", "ListItem", [q("Battery"), "null", "null", q("82%")]),
        call("settings", "ListItem", [q("Settings"), q("Network and storage"), q("settings"), "null", `@ToAssistant("Open settings")`]),
      ],
    ),
  },
  {
    group: "Lists",
    name: "Toggle",
    description: "Switch row. It flips on tap and does not take an action.",
    source: screen(
      ["list"],
      [
        call("list", "ListBlock", ["[plane, alerts, power]", q("Settings")]),
        call("plane", "Toggle", [q("Airplane mode"), "false", q("plane")]),
        call("alerts", "Toggle", [q("Notifications"), "true", q("bell"), q("Banners and sounds")]),
        call("power", "Toggle", [q("Low power"), "false"]),
      ],
    ),
  },
  {
    group: "Lists",
    name: "KVList",
    description: "Label and value rows for a summary.",
    source: screen(
      ["facts"],
      [
        call("facts", "KVList", [
          `[${[
            ["Name", "Rivera"],
            ["When", "7:30 PM"],
            ["Party", "6"],
            ["Table", "Window"],
          ]
            .map(([label, value]) => obj({ label, value }))
            .join(", ")}]`,
          q("Reservation"),
        ]),
      ],
    ),
  },
  {
    group: "Media & Social",
    name: "ImageBlock",
    description: "Full-width image. The caption sits along the bottom.",
    source: screen(
      ["photo"],
      [call("photo", "ImageBlock", [q(swatch("#3d5a4c", "North shore")), q("North shore, late light")])],
    ),
  },
  {
    group: "Media & Social",
    name: "PhotoGrid",
    description: "Three-column grid of images.",
    source: screen(
      ["grid"],
      [
        call("grid", "PhotoGrid", [
          `[${[
            ["#3d5a4c", "Shore"],
            ["#8c4a3a", "Cabin"],
            ["#3d4f6f", "Lake"],
            ["#6b5b4b", "Trail"],
            ["#2f3d36", "Pines"],
            ["#6e3b4a", "Dusk"],
          ]
            .map(([fill, label]) => image(fill, label, 400, 400))
            .join(", ")}]`,
        ]),
      ],
    ),
  },
  {
    group: "Media & Social",
    name: "Bubbles",
    description: "Chat thread. A message marked me sits on the right.",
    source: screen(
      ["thread"],
      [
        call("thread", "Bubbles", [
          `[${[
            obj({ text: "Running five late", time: "6:58 PM" }),
            obj({ text: "Window table. I'll order the olives.", me: true }),
            obj({ text: "Get the bitter greens too" }),
            obj({ text: "Done.", me: true, time: "7:04 PM" }),
          ].join(", ")}]`,
        ]),
      ],
    ),
  },
  {
    group: "Media & Social",
    name: "Chips",
    description: "Horizontal filter pills. The first label starts selected.",
    source: screen(["filters"], [call("filters", "Chips", [`[${[q("All"), q("Nearby"), q("Open now"), q("Top rated")].join(", ")}]`])]),
  },
  {
    group: "Media & Social",
    name: "Tabs",
    description: "Switches between panes on tap, without a round trip.",
    source: screen(
      ["tabs"],
      [
        call("tabs", "Tabs", ["[overview, menu]"]),
        call("overview", "TabItem", [q("Overview"), "[intro, note]"]),
        call("intro", "TextContent", [q("A window table for six, at 7:30.")]),
        call("note", "TextCallout", [q("info"), q("Ask for the corner"), q("It is the quieter one.")]),
        call("menu", "TabItem", [q("Menu"), "[dishes]"]),
        call("dishes", "ListBlock", ["[olives, pasta]", q("On the table")]),
        call("olives", "ListItem", [q("Olives"), "null", "null", q("$8")]),
        call("pasta", "ListItem", [q("Campanelle"), "null", "null", q("$24")]),
      ],
    ),
  },
  {
    group: "Media & Social",
    name: "TabItem",
    description: "One tab: a label, then the content shown when it is selected.",
    source: screen(
      ["tabs"],
      [
        call("tabs", "Tabs", ["[first, second, third]"]),
        call("first", "TabItem", [q("First"), "[firstBody]"]),
        call("second", "TabItem", [q("Second"), "[secondBody]"]),
        call("third", "TabItem", [q("Third"), "[thirdBody]"]),
        call("firstBody", "TextContent", [q("The first pane.")]),
        call("secondBody", "TextContent", [q("The second pane.")]),
        call("thirdBody", "TextContent", [q("The third pane.")]),
      ],
    ),
  },
  {
    group: "Media & Social",
    name: "Map",
    description: "Street map fitted to its markers. route draws the road path in marker order.",
    minHeight: 360,
    source: screen(
      ["map"],
      [
        call("map", "Map", ["[ferry, coit]", "true", "null", "340"]),
        call("ferry", "MapMarker", [q("Ferry Building"), "37.7955", "-122.3933"]),
        call("coit", "MapMarker", [q("Coit Tower"), "37.8024", "-122.4058"]),
      ],
    ),
  },
  {
    group: "Media & Social",
    name: "MapMarker",
    description: "A place on a map. One emoji replaces the numbered pin, and a category can filter the set.",
    minHeight: 360,
    source: screen(
      ["map"],
      [
        call("map", "Map", ["[ferry, dolores, palace]", "null", "null", "340"]),
        call("ferry", "MapMarker", [q("Ferry Building"), "37.7955", "-122.3933", q("Food"), q("🍞")]),
        call("dolores", "MapMarker", [q("Dolores Park"), "37.7596", "-122.4269", q("Outdoors"), q("🌳")]),
        call("palace", "MapMarker", [q("Palace of Fine Arts"), "37.8029", "-122.4484", q("Sights")]),
      ],
    ),
  },
  {
    group: "Media & Social",
    name: "HtmlView",
    description: "Sandboxed HTML page with inline JavaScript. It fits its content unless a height is set.",
    source: screen(["page"], [call("page", "HtmlView", [q(html), "null", q("Tap counter")])]),
  },
  {
    group: "Content",
    name: "Markdown",
    description: "Prose with headings, lists, quotes, links, code, and rules.",
    source: screen(["body"], [call("body", "Markdown", [q(markdown)])]),
  },
  {
    group: "Content",
    name: "Table",
    description: "Columns and rows. A column of numbers or amounts aligns right.",
    source: screen(
      ["table"],
      [
        call("table", "Table", [
          `[${[q("Dish"), q("Seats"), q("Price")].join(", ")}]`,
          `[${[
            `[${q("Campanelle")}, 4, ${q("$24")}]`,
            `[${q("Halibut")}, 2, ${q("$36")}]`,
            `[${q("Olive oil cake")}, 6, ${q("$12")}]`,
          ].join(", ")}]`,
        ]),
      ],
    ),
  },
  {
    group: "Drawing",
    name: "Svg",
    description: "A drawing that scales to its width. Shapes go inside it.",
    source: drawing,
  },
  {
    group: "Drawing",
    name: "G",
    description: "A group of shapes. transform rotates, moves, or scales the group.",
    source: screen(
      ["drawing"],
      [
        call("drawing", "Svg", ["[rest, group]", q("0 0 120 80"), "200"]),
        call("rest", "Rect", ["28", "22", "64", "36", q("surface"), "null", "null", "null", "8"]),
        call("group", "G", ["[turned]", q("rotate(-18 60 40)")]),
        call("turned", "Rect", ["28", "22", "64", "36", q("ink"), "null", "null", "null", "8"]),
      ],
    ),
  },
  {
    group: "Drawing",
    name: "Circle",
    description: "A circle, filled unless a stroke is set on its own.",
    source: shape("Circle", ["60", "40", "22", q("ink")]),
  },
  {
    group: "Drawing",
    name: "Ellipse",
    description: "An ellipse, set by its center and two radii.",
    source: shape("Ellipse", ["60", "40", "40", "18", q("chart3")]),
  },
  {
    group: "Drawing",
    name: "Rect",
    description: "A rectangle. The last number is an optional corner radius.",
    source: shape("Rect", ["18", "16", "84", "48", q("ink"), "null", "null", "null", "12"]),
  },
  {
    group: "Drawing",
    name: "Line",
    description: "A straight stroke between two points.",
    source: shape("Line", ["16", "40", "104", "40", q("ink"), "3"]),
  },
  {
    group: "Drawing",
    name: "Path",
    description: "An SVG path, filled or stroked.",
    source: shape("Path", [q("M 16 46 C 16 28 44 24 60 42 C 76 24 104 28 104 46 C 104 62 60 74 60 74 C 60 74 16 62 16 46"), q("danger")]),
  },
  {
    group: "Drawing",
    name: "Polyline",
    description: "An open stroke through a list of points.",
    source: shape("Polyline", [q("12,56 32,24 52,48 74,20 108,44"), q("ink"), "3"]),
  },
  {
    group: "Drawing",
    name: "Polygon",
    description: "A filled polygon.",
    source: shape("Polygon", [q("60,14 104,66 16,66"), q("ink")]),
  },
  {
    group: "Drawing",
    name: "SvgText",
    description: "Text placed in the drawing, with a size, color, anchor, and weight.",
    source: shape("SvgText", [q("Aa"), "60", "48", "28", q("ink"), q("middle"), q("semibold")]),
  },
  {
    group: "Buttons",
    name: "Buttons",
    description: "A group of buttons, in a row or a column.",
    source: screen(
      ["row", "column"],
      [
        call("row", "Buttons", ["[save, share]", q("row")]),
        call("save", "Button", [q("Save")]),
        call("share", "Button", [q("Share"), "null", q("secondary")]),
        call("column", "Buttons", ["[confirm, cancel]", q("column")]),
        call("confirm", "Button", [q("Confirm")]),
        call("cancel", "Button", [q("Cancel"), "null", q("tertiary")]),
      ],
    ),
  },
  {
    group: "Buttons",
    name: "Button",
    description: "Primary, secondary, or tertiary. Type can be destructive, and size runs from extra-small to large.",
    source: screen(
      ["stack"],
      [
        call("stack", "Buttons", ["[primary, secondary, tertiary, destructive, quiet, extraSmall, small, medium, large]", q("column")]),
        call("primary", "Button", [q("Primary"), "null", q("primary")]),
        call("secondary", "Button", [q("Secondary"), "null", q("secondary")]),
        call("tertiary", "Button", [q("Tertiary"), "null", q("tertiary")]),
        call("destructive", "Button", [q("Destructive"), "null", q("primary"), q("destructive")]),
        call("quiet", "Button", [q("Quiet destructive"), "null", q("tertiary"), q("destructive")]),
        call("extraSmall", "Button", [q("Extra small"), "null", q("secondary"), "null", q("extra-small")]),
        call("small", "Button", [q("Small"), "null", q("secondary"), "null", q("small")]),
        call("medium", "Button", [q("Medium"), "null", q("secondary"), "null", q("medium")]),
        call("large", "Button", [q("Large"), "null", q("secondary"), "null", q("large")]),
      ],
    ),
  },
]

export function sampleId(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}
