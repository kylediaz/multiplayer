"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Atom, ChevronRight, Code, Sparkles } from "lucide-react"
import type { GenerationMode } from "@shared/lang"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const MODES = [
  {
    id: "react",
    label: "React",
    icon: Atom,
    detail: "A React component styled with the canvas kit.",
  },
  {
    id: "decide",
    label: "Decide",
    icon: Sparkles,
    detail: "The model chooses React or OpenUI.",
  },
  {
    id: "openui",
    label: "OpenUI",
    icon: Code,
    detail: "An OpenUI program.",
  },
] as const satisfies ReadonlyArray<{
  id: GenerationMode
  label: string
  icon: typeof Atom
  detail: string
}>

const EXAMPLES = [
  { label: "Scoreboard", prompt: "A two-player scoreboard with a reset button" },
  { label: "Histogram", prompt: "A histogram counting the letters in this sentence" },
  { label: "Todo list", prompt: "A shared todo list" },
]

function isMode(value: string | undefined): value is GenerationMode {
  return value === "react" || value === "decide" || value === "openui"
}

export function PromptForm() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [mode, setMode] = useState<GenerationMode>("react")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const selected = MODES.find((item) => item.id === mode) ?? MODES[0]

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const text = prompt.trim()
    if (!text || pending) return
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: text, mode }),
      })
      const body: unknown = await response.json()
      const id = typeof body === "object" && body !== null && "id" in body && typeof body.id === "string" ? body.id : null
      const message =
        typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
          ? body.error
          : "The document could not be created."
      if (!response.ok || !id) {
        setError(message)
        return
      }
      router.push(`/v/${id}`)
    } catch {
      setError("The document could not be created.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader>
          <CardTitle>Create a document</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Language</FieldLabel>
              <ToggleGroup
                aria-label="Language"
                variant="outline"
                spacing={0}
                className="w-full"
                value={[mode]}
                disabled={pending}
                onValueChange={(next, details) => {
                  const value = next[0]
                  if (!isMode(value)) {
                    details.cancel()
                    return
                  }
                  setMode(value)
                }}
              >
                {MODES.map((item) => (
                  <ToggleGroupItem key={item.id} value={item.id} className="flex-1">
                    <item.icon strokeWidth={2} />
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="prompt">Prompt</FieldLabel>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="A two-player scoreboard with a reset button"
                disabled={pending}
                rows={5}
                className="min-h-28"
              />
            </Field>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 border-t sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((example) => (
              <Button
                key={example.label}
                type="button"
                size="sm"
                variant={prompt === example.prompt ? "secondary" : "outline"}
                disabled={pending}
                onClick={() => setPrompt(example.prompt)}
              >
                {example.label}
              </Button>
            ))}
          </div>
          <Button type="submit" disabled={pending || !prompt.trim()}>
            {pending ? "Generating" : "Create document"}
            {pending ? <Spinner /> : <ChevronRight strokeWidth={2} data-icon="inline-end" />}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
