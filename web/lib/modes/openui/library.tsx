import { createLibrary, type ComponentGroup } from "@openuidev/react-lang"
import { z, type ZodType } from "zod"
import { Button, Buttons } from "./components/buttons"
import { HtmlView } from "./components/html-view"
import { KVList, ListBlock, ListItem, Toggle } from "./components/lists"
import { MapMarker, MapView } from "./components/map/map"
import { Markdown } from "./components/markdown"
import { Bubbles, ImageBlock, PhotoGrid, TabItem, Tabs } from "./components/media"
import { setScreenChild } from "./components/screen"
import { Card, CardHeader, TextCallout, TextContent } from "./components/structure"
import { Svg, svgComponents } from "./components/svg"
import { Table } from "./components/table"
import { functions } from "./functions"

setScreenChild(
  z.union([
    CardHeader.ref,
    TextContent.ref,
    TextCallout.ref,
    ListBlock.ref,
    KVList.ref,
    ImageBlock.ref,
    PhotoGrid.ref,
    Bubbles.ref,
    Tabs.ref,
    MapView.ref,
    HtmlView.ref,
    Markdown.ref,
    Table.ref,
    Svg.ref,
    Buttons.ref,
  ] as unknown as [ZodType, ZodType, ...ZodType[]]),
)

const groups: ComponentGroup[] = [
  {
    name: "Structure",
    components: ["Card", "CardHeader", "TextContent", "TextCallout"],
    notes: ["Most screens start with CardHeader. A media-first screen may start with ImageBlock."],
  },
  {
    name: "Lists",
    components: ["ListBlock", "ListItem", "Toggle", "KVList"],
    notes: ["ListBlock with ListItem rows is the main way to show a collection.", "Toggle rows flip locally and do not take an action."],
  },
  {
    name: "Media & Social",
    components: ["ImageBlock", "PhotoGrid", "Bubbles", "Tabs", "TabItem", "Map", "MapMarker", "HtmlView"],
    notes: ["Map takes MapMarker places: label, latitude, longitude. route draws the road path in marker order."],
  },
  {
    name: "Content",
    components: ["Markdown", "Table"],
    notes: ["Use Markdown for prose. Use Table when the screen is a grid of columns and rows."],
  },
  {
    name: "Drawing",
    components: ["Svg", "G", "Circle", "Ellipse", "Rect", "Line", "Path", "Polyline", "Polygon", "SvgText"],
    notes: ['Put shapes inside Svg. Color is "ink", "muted", "surface", "info", "success", "warning", "danger", "accent", "navy", "pine", "chestnut", "marigold", "lavender", "pistachio", "rose", or a CSS color.'],
  },
  {
    name: "Buttons",
    components: ["Buttons", "Button"],
    notes: ["Put Button components inside Buttons. One primary per screen; a second strong action is fill. There are no form fields."],
  },
]

export const openuiLibrary = createLibrary({
  root: "Card",
  componentGroups: groups,
  components: [
    Card,
    CardHeader,
    TextContent,
    TextCallout,
    ListItem,
    Toggle,
    ListBlock,
    KVList,
    ImageBlock,
    PhotoGrid,
    Bubbles,
    TabItem,
    Tabs,
    MapView,
    MapMarker,
    HtmlView,
    Markdown,
    Table,
    ...svgComponents,
    Buttons,
    Button,
  ],
  functions,
})
