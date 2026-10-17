import { notFound } from "next/navigation"
import { ApiDocClient } from "@/components/doc/api-doc-client"
import { fetchDocument } from "@/lib/dataplane"
import { readRevisionFile } from "@/lib/modes/revision-file"

export default async function DataplaneDocPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params
  let document
  try {
    document = await fetchDocument(docId)
  } catch {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-sm text-muted-foreground">
        The dataplane is not running. Start it with <code className="font-mono">bun api/index.ts</code>.
      </main>
    )
  }
  if (!document) notFound()
  const source = document.viewRevision ? readRevisionFile(document.viewRevision, "source.txt") : null
  return <ApiDocClient document={document} source={source} />
}
