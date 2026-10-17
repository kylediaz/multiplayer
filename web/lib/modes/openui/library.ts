import { createChartRenderers } from "./charts"
import {
  Bubbles,
  Card,
  CardHeader,
  Chips,
  HeroStat,
  ImageBlock,
  KVList,
  ListBlock,
  ListItem,
  MapView,
  PhotoGrid,
  StatTiles,
  Tabs,
  TextCallout,
  TextContent,
  Toggle,
} from "./components"
import { buildApplessLibrary } from "./contract"
import { Button, Buttons, DatePicker, Form, FormControl, Input, Select, Slider, TextArea } from "./forms"
import { useCds } from "./theme"

const charts = createChartRenderers(useCds)

export const cupertinoLibrary = buildApplessLibrary({
  Card,
  CardHeader,
  TextContent,
  TextCallout,
  ListItem,
  Toggle,
  ListBlock,
  KVList,
  HeroStat,
  StatTiles,
  ImageBlock,
  PhotoGrid,
  Bubbles,
  Chips,
  Tabs,
  MapView,
  ...charts,
  Form,
  FormControl,
  Input,
  TextArea,
  Select,
  DatePicker,
  Slider,
  Buttons,
  Button,
})
