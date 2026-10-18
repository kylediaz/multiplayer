import { defineComponent, reactive } from "@openuidev/react-lang"
import { z } from "zod"
import { MapComponent } from "./map.client"

export const MapMarker = defineComponent({
  name: "MapMarker",
  props: z.object({
    label: z.string(),
    lat: z.number(),
    lng: z.number(),
    category: z.string().optional(),
    icon: z.string().optional(),
  }),
  description: "A place on a Map; icon is one emoji, else the pin shows its number.",
  component: () => null,
})

export const MapView = defineComponent({
  name: "Map",
  props: z.object({
    markers: z.array(MapMarker.ref),
    route: z.boolean().optional(),
    selected: reactive(z.string().optional()),
    height: z.number().optional(),
  }),
  description: "Street map fitted to its markers. route draws the road path in marker order; selected holds the clicked marker's label.",
  component: MapComponent,
})
