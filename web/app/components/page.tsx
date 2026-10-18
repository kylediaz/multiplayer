import type { Metadata } from "next"
import { Gallery } from "./gallery"

export const metadata: Metadata = {
  title: "Components",
  description: "Every OpenUI component, rendered with the library.",
}

export default function ComponentsPage() {
  return <Gallery />
}
