import type { Metadata } from "next"
import { Showcase } from "./showcase"

export const metadata: Metadata = {
  title: "Showcase",
  description: "Example apps in React and OpenUI",
}

export default function ShowcasePage() {
  return <Showcase />
}
