"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function PromptForm() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const body = (await response.json()) as { id?: string; error?: string }
      if (!response.ok || !body.id) {
        setError(body.error ?? "The document could not be created.")
        return
      }
      router.push(`/v/${body.id}`)
    } catch {
      setError("The document could not be created.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="A two-player scoreboard with a reset button"
        disabled={pending}
        rows={5}
        aria-label="Prompt"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending || !prompt.trim()}>
          {pending ? "Generating" : "Create document"}
        </Button>
        {error && <span className="text-xs text-muted-foreground">{error}</span>}
      </div>
    </form>
  )
}
