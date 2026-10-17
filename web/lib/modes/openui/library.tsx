import type { ReactNode } from "react"
import { action, createLibrary, defineComponent, type ComponentGroup } from "@openuidev/react-lang"
import { z, type ZodType } from "zod"
import { swatchColors } from "../common/kit/colors"
import {
  Alert,
  AreaChart,
  Badge,
  BarChart,
  Card,
  CardBody,
  CardHeader,
  Code,
  CollapsibleSection,
  DiffStats,
  DiffView,
  Grid,
  H1,
  H2,
  H3,
  IconButton,
  LineChart,
  Link,
  PieChart,
  Progress,
  Row,
  Separator,
  Spacer,
  Stack,
  Stat,
  Swatch,
  Table,
  Tabs,
  Text,
  TodoList,
  UsageBar,
} from "../common/kit"
import { OpenButton, OpenCheckbox, OpenSelect, OpenSlider, OpenSwitch, OpenTextArea, OpenTextInput } from "./fields"

let block: ZodType = z.unknown()

function children() {
  return z.array(z.lazy(() => block))
}

function show(value: unknown) {
  return value as ReactNode
}

const swatch = z.enum(swatchColors)
const series = z.array(z.object({ name: z.string(), data: z.array(z.number()) }))
const categories = z.array(z.string())

const StackView = defineComponent({
  name: "Stack",
  props: z.object({ children: children(), gap: z.number().optional() }),
  description: "Vertical stack. The page root. gap is pixels between children.",
  component: ({ props, renderNode }) => <Stack gap={props.gap}>{show(renderNode(props.children))}</Stack>,
})

const RowView = defineComponent({
  name: "Row",
  props: z.object({
    children: children(),
    gap: z.number().optional(),
    align: z.enum(["start", "center", "end", "stretch"]).optional(),
    justify: z.enum(["start", "center", "end", "space-between"]).optional(),
  }),
  description: "Horizontal row.",
  component: ({ props, renderNode }) => (
    <Row gap={props.gap} align={props.align} justify={props.justify}>
      {show(renderNode(props.children))}
    </Row>
  ),
})

const GridView = defineComponent({
  name: "Grid",
  props: z.object({
    children: children(),
    columns: z.union([z.number(), z.string()]),
    gap: z.number().optional(),
  }),
  description: "Grid. columns is a count or a CSS template.",
  component: ({ props, renderNode }) => (
    <Grid columns={props.columns} gap={props.gap}>
      {show(renderNode(props.children))}
    </Grid>
  ),
})

const SpacerView = defineComponent({
  name: "Spacer",
  props: z.object({}),
  description: "Flexible gap that pushes siblings apart inside a Row.",
  component: () => <Spacer />,
})

const SeparatorView = defineComponent({
  name: "Separator",
  props: z.object({}),
  description: "Horizontal rule.",
  component: () => <Separator />,
})

const H1View = defineComponent({
  name: "H1",
  props: z.object({ text: z.string() }),
  description: "Page title.",
  component: ({ props }) => <H1>{props.text}</H1>,
})

const H2View = defineComponent({
  name: "H2",
  props: z.object({ text: z.string() }),
  description: "Section heading.",
  component: ({ props }) => <H2>{props.text}</H2>,
})

const H3View = defineComponent({
  name: "H3",
  props: z.object({ text: z.string() }),
  description: "Small heading.",
  component: ({ props }) => <H3>{props.text}</H3>,
})

const TextView = defineComponent({
  name: "Text",
  props: z.object({
    text: z.string(),
    tone: z.enum(["primary", "secondary", "muted"]).optional(),
    size: z.enum(["body", "small"]).optional(),
  }),
  description: "Body text. tone: primary, secondary, or muted.",
  component: ({ props }) => (
    <Text tone={props.tone} size={props.size}>
      {props.text}
    </Text>
  ),
})

const CodeView = defineComponent({
  name: "Code",
  props: z.object({ text: z.string() }),
  description: "Inline code.",
  component: ({ props }) => <Code>{props.text}</Code>,
})

const LinkView = defineComponent({
  name: "Link",
  props: z.object({ text: z.string(), href: z.string() }),
  description: "Text link.",
  component: ({ props }) => <Link href={props.href}>{props.text}</Link>,
})

const CardView = defineComponent({
  name: "Card",
  props: z.object({ children: children() }),
  description: "Bordered surface for one named thing. Do not put a Card inside a Card.",
  component: ({ props, renderNode }) => <Card>{show(renderNode(props.children))}</Card>,
})

const CardHeaderView = defineComponent({
  name: "CardHeader",
  props: z.object({ title: z.string(), trailing: z.string().optional() }),
  description: "Card title. Plain text, with an optional trailing label.",
  component: ({ props }) => <CardHeader trailing={props.trailing}>{props.title}</CardHeader>,
})

const CardBodyView = defineComponent({
  name: "CardBody",
  props: z.object({ children: children() }),
  description: "Card content under the header.",
  component: ({ props, renderNode }) => <CardBody>{show(renderNode(props.children))}</CardBody>,
})

const ButtonView = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    variant: z.enum(["default", "secondary", "outline", "ghost", "destructive", "link"]).optional(),
    action: action().optional(),
  }),
  description: 'Button. variant: "default", "secondary", "outline", "ghost", "destructive", or "link".',
  component: ({ props }) => <OpenButton label={props.label} variant={props.variant} action={props.action} />,
})

const BadgeView = defineComponent({
  name: "Badge",
  props: z.object({
    label: z.string(),
    variant: z.enum(["default", "secondary", "destructive", "outline", "ghost"]).optional(),
  }),
  description: "Small status label.",
  component: ({ props }) => <Badge variant={props.variant}>{props.label}</Badge>,
})

const AlertView = defineComponent({
  name: "Alert",
  props: z.object({
    title: z.string(),
    description: z.string().optional(),
    variant: z.enum(["default", "destructive", "info", "success", "warning"]).optional(),
  }),
  description: "Callout. variant: default, destructive, info, success, or warning.",
  component: ({ props }) => (
    <Alert title={props.title} variant={props.variant}>
      {props.description}
    </Alert>
  ),
})

const StatView = defineComponent({
  name: "Stat",
  props: z.object({ value: z.string(), label: z.string() }),
  description: "One metric, large value with a short label.",
  component: ({ props }) => <Stat value={props.value} label={props.label} />,
})

const TableView = defineComponent({
  name: "Table",
  props: z.object({
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  description: "Table of strings. Do not wrap it in a Card unless the card is a named entity.",
  component: ({ props }) => <Table headers={props.headers} rows={props.rows} />,
})

const ProgressView = defineComponent({
  name: "Progress",
  props: z.object({ value: z.number(), label: z.string().optional() }),
  description: "Progress bar. value is 0 to 100.",
  component: ({ props }) => <Progress value={props.value} label={props.label} />,
})

const TabItemView = defineComponent({
  name: "TabItem",
  props: z.object({
    value: z.string(),
    label: z.string(),
    content: children(),
  }),
  description: "One tab. value is the id, label is the trigger, content is the panel.",
  component: () => null,
})

const TabsView = defineComponent({
  name: "Tabs",
  props: z.object({
    items: z.array(TabItemView.ref),
    defaultValue: z.string().optional(),
  }),
  description: "Tabbed sections. items are TabItem references.",
  component: ({ props, renderNode }) => (
    <Tabs
      defaultValue={props.defaultValue}
      tabs={readList<{ value: string; label: string; content: unknown }>(props.items).map((item) => ({
        value: item.value,
        label: item.label,
        content: show(renderNode(item.content)),
      }))}
    />
  ),
})

const TextInputView = defineComponent({
  name: "TextInput",
  props: z.object({
    placeholder: z.string().optional(),
    value: z.string().optional(),
    type: z.enum(["text", "email", "password", "number", "url", "search"]).optional(),
  }),
  description: "Single-line text field.",
  component: ({ props }) => <OpenTextInput placeholder={props.placeholder} value={props.value} type={props.type} />,
})

const TextAreaView = defineComponent({
  name: "TextArea",
  props: z.object({
    placeholder: z.string().optional(),
    value: z.string().optional(),
    rows: z.number().optional(),
  }),
  description: "Multi-line text field.",
  component: ({ props }) => <OpenTextArea placeholder={props.placeholder} value={props.value} rows={props.rows} />,
})

const CheckboxView = defineComponent({
  name: "Checkbox",
  props: z.object({ label: z.string().optional(), checked: z.boolean().optional() }),
  description: "Checkbox with a label.",
  component: ({ props }) => <OpenCheckbox label={props.label} checked={props.checked} />,
})

const SwitchView = defineComponent({
  name: "Switch",
  props: z.object({ label: z.string().optional(), checked: z.boolean().optional() }),
  description: "On or off switch.",
  component: ({ props }) => <OpenSwitch label={props.label} checked={props.checked} />,
})

const SelectView = defineComponent({
  name: "Select",
  props: z.object({
    options: z.array(z.object({ value: z.string(), label: z.string() })),
    placeholder: z.string().optional(),
    value: z.string().optional(),
  }),
  description: "Dropdown. options are { value, label }.",
  component: ({ props }) => <OpenSelect options={props.options} placeholder={props.placeholder} value={props.value} />,
})

const SliderView = defineComponent({
  name: "Slider",
  props: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    value: z.number().optional(),
  }),
  description: "Numeric slider.",
  component: ({ props }) => <OpenSlider min={props.min} max={props.max} value={props.value} />,
})

const IconButtonView = defineComponent({
  name: "IconButton",
  props: z.object({ label: z.string() }),
  description: "Square icon button. label is the accessible name and the visible text.",
  component: ({ props }) => <IconButton title={props.label}>{props.label}</IconButton>,
})

const BarChartView = defineComponent({
  name: "BarChart",
  props: z.object({
    categories,
    series,
    stacked: z.boolean().optional(),
    horizontal: z.boolean().optional(),
  }),
  description: "Bar chart. series is { name, data }[] aligned with categories.",
  component: ({ props }) => <BarChart categories={props.categories} series={props.series} stacked={props.stacked} horizontal={props.horizontal} />,
})

const LineChartView = defineComponent({
  name: "LineChart",
  props: z.object({ categories, series }),
  description: "Line chart for a trend. series is { name, data }[].",
  component: ({ props }) => <LineChart categories={props.categories} series={props.series} />,
})

const AreaChartView = defineComponent({
  name: "AreaChart",
  props: z.object({ categories, series }),
  description: "Area chart. series is { name, data }[].",
  component: ({ props }) => <AreaChart categories={props.categories} series={props.series} />,
})

const PieChartView = defineComponent({
  name: "PieChart",
  props: z.object({
    data: z.array(z.object({ label: z.string(), value: z.number() })),
    donut: z.boolean().optional(),
  }),
  description: "Pie chart. data is { label, value }[]. Set donut for a ring.",
  component: ({ props }) => <PieChart data={props.data} donut={props.donut} />,
})

const CollapsibleSectionView = defineComponent({
  name: "CollapsibleSection",
  props: z.object({ title: z.string(), children: children(), count: z.number().optional() }),
  description: "Disclosure. Starts closed unless the user asked for it open.",
  component: ({ props, renderNode }) => (
    <CollapsibleSection title={props.title} count={props.count}>
      {show(renderNode(props.children))}
    </CollapsibleSection>
  ),
})

const DiffStatsView = defineComponent({
  name: "DiffStats",
  props: z.object({ additions: z.number().optional(), deletions: z.number().optional() }),
  description: "Compact +additions and -deletions counts.",
  component: ({ props }) => <DiffStats additions={props.additions} deletions={props.deletions} />,
})

const DiffViewView = defineComponent({
  name: "DiffView",
  props: z.object({
    lines: z.array(z.object({
      type: z.enum(["added", "removed", "unchanged"]),
      content: z.string(),
      lineNumber: z.number().optional(),
    })),
    path: z.string().optional(),
  }),
  description: "Line diff. Each line is { type, content, lineNumber }.",
  component: ({ props }) => <DiffView lines={props.lines} path={props.path} />,
})

const UsageBarView = defineComponent({
  name: "UsageBar",
  props: z.object({
    segments: z.array(z.object({ id: z.string(), value: z.number(), color: swatch.optional() })),
    total: z.number(),
    topLeftLabel: z.string().optional(),
    topRightLabel: z.string().optional(),
  }),
  description: "Segmented meter. total is the full amount.",
  component: ({ props }) => (
    <UsageBar segments={props.segments} total={props.total} topLeftLabel={props.topLeftLabel} topRightLabel={props.topRightLabel} />
  ),
})

const TodoListView = defineComponent({
  name: "TodoList",
  props: z.object({
    todos: z.array(z.object({
      id: z.string(),
      content: z.string(),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
    })),
  }),
  description: "Task list. status is pending, in_progress, completed, or cancelled.",
  component: ({ props }) => <TodoList todos={props.todos} />,
})

const SwatchView = defineComponent({
  name: "Swatch",
  props: z.object({ color: swatch }),
  description: `Color chip. color is one of ${swatchColors.join(", ")}.`,
  component: ({ props }) => <Swatch color={props.color} />,
})

block = z.union([
  StackView.ref,
  RowView.ref,
  GridView.ref,
  SpacerView.ref,
  SeparatorView.ref,
  H1View.ref,
  H2View.ref,
  H3View.ref,
  TextView.ref,
  CodeView.ref,
  LinkView.ref,
  CardView.ref,
  CardHeaderView.ref,
  CardBodyView.ref,
  ButtonView.ref,
  BadgeView.ref,
  AlertView.ref,
  StatView.ref,
  TableView.ref,
  ProgressView.ref,
  TabsView.ref,
  TextInputView.ref,
  TextAreaView.ref,
  CheckboxView.ref,
  SwitchView.ref,
  SelectView.ref,
  SliderView.ref,
  IconButtonView.ref,
  BarChartView.ref,
  LineChartView.ref,
  AreaChartView.ref,
  PieChartView.ref,
  CollapsibleSectionView.ref,
  DiffStatsView.ref,
  DiffViewView.ref,
  UsageBarView.ref,
  TodoListView.ref,
  SwatchView.ref,
] as unknown as [ZodType, ZodType, ...ZodType[]])

const groups: ComponentGroup[] = [
  { name: "Layout", components: ["Stack", "Row", "Grid", "Spacer", "Separator", "Tabs", "TabItem", "CollapsibleSection"] },
  { name: "Type", components: ["H1", "H2", "H3", "Text", "Code", "Link"] },
  { name: "Surfaces", components: ["Card", "CardHeader", "CardBody", "Alert", "Badge", "Stat", "Table", "Progress"] },
  { name: "Controls", components: ["Button", "IconButton", "TextInput", "TextArea", "Checkbox", "Switch", "Select", "Slider"] },
  { name: "Charts", components: ["BarChart", "LineChart", "AreaChart", "PieChart"] },
  { name: "Extras", components: ["TodoList", "DiffView", "DiffStats", "UsageBar", "Swatch"] },
]

export const kitLibrary = createLibrary({
  root: "Stack",
  componentGroups: groups,
  components: [
    StackView,
    RowView,
    GridView,
    SpacerView,
    SeparatorView,
    H1View,
    H2View,
    H3View,
    TextView,
    CodeView,
    LinkView,
    CardView,
    CardHeaderView,
    CardBodyView,
    ButtonView,
    BadgeView,
    AlertView,
    StatView,
    TableView,
    ProgressView,
    TabsView,
    TabItemView,
    TextInputView,
    TextAreaView,
    CheckboxView,
    SwitchView,
    SelectView,
    SliderView,
    IconButtonView,
    BarChartView,
    LineChartView,
    AreaChartView,
    PieChartView,
    CollapsibleSectionView,
    DiffStatsView,
    DiffViewView,
    UsageBarView,
    TodoListView,
    SwatchView,
  ],
})

function readList<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    if ("props" in item && item.props && typeof item.props === "object") return [item.props as T]
    return [item as T]
  })
}
