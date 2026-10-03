import type { Schema } from "@shared/sync/schema"

export const dataplaneUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003"

export type DataplaneDocument = {
  id: string
  title: string
  schema: Schema
  viewRevision: string | null
  headVersion: number
}

export function dataplaneSocketUrl(docId: string): string {
  const ws = dataplaneUrl.replace(/^http/, "ws")
  return `${ws}/v1/documents/${encodeURIComponent(docId)}/sync`
}

export async function fetchDocument(id: string): Promise<DataplaneDocument | null> {
  const response = await fetch(`${dataplaneUrl}/v1/documents/${encodeURIComponent(id)}`, { cache: "no-store" })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`dataplane ${response.status}`)
  return response.json()
}
