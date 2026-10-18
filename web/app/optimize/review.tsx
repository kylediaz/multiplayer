"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { cn } from "cn"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import type { DocumentLang } from "@shared/lang"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { CodeBlock, CodeBlockContent, CodeBlockCopyButton, CodeBlockHeader } from "@/components/ui/code-block"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Choice } from "@/lib/optimize/store"
import { OpenUICandidate } from "./openui"

export type ReviewSide = {
  id: string
  title: string
  lang: DocumentLang
  promptVersion: string
  source: string
}

type Review = { pairId: string; task: string; a: ReviewSide; b: ReviewSide }

const CHOICES: { id: Choice; label: string }[] = [
  { id: "a", label: "Left is better" },
  { id: "b", label: "Right is better" },
  { id: "tie", label: "Tie" },
  { id: "both_bad", label: "Both bad" },
]

export function Optimize({ pending, judged, review }: { pending: number; judged: number; review: Review | null }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 pt-10 pb-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-sm font-medium">Optimize</h1>
        <p className="text-xs text-muted-foreground tabular-nums">
          {pending} waiting · {judged} judged
        </p>
      </header>
      {review ? (
        <ReviewPair key={review.pairId} review={review} />
      ) : (
        <Empty className="flex-1 border">
          <EmptyHeader>
            <EmptyTitle>No pairs waiting</EmptyTitle>
            <EmptyDescription>
              Generate some with <code className="font-mono">pnpm optimize &quot;a task&quot;</code>, then reload.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  )
}

function ReviewPair({ review }: { review: Review }) {
  const router = useRouter()
  const [choice, setChoice] = useState<Choice | null>(null)
  const [critique, setCritique] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!choice || pending) return
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/optimize/judgments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pairId: review.pairId, choice, critique }),
      })
      const body = (await response.json()) as { id?: string; error?: string }
      if (!response.ok || !body.id) {
        setError(body.error ?? "The judgment could not be saved.")
        return
      }
      router.push("/optimize")
      router.refresh()
    } catch {
      setError("The judgment could not be saved.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      <Prompt text={review.task} />
      <div className="grid grid-cols-2 gap-6">
        <Candidate side={review.a} />
        <Candidate side={review.b} />
      </div>
      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl bg-background/90 p-3 shadow-lg ring-1 ring-foreground/10 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ToggleGroup
            aria-label="Preference"
            variant="outline"
            spacing={0}
            className="w-full sm:flex-1"
            value={choice ? [choice] : []}
            disabled={pending}
            onValueChange={(next) => setChoice(CHOICES.find((item) => item.id === next[0])?.id ?? null)}
          >
            {CHOICES.map((item) => (
              <ToggleGroupItem key={item.id} value={item.id} className="flex-1">
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button type="submit" disabled={pending || !choice}>
            {pending ? "Saving" : "Save and next"}
            {pending ? <Spinner /> : <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />}
          </Button>
        </div>
        <Textarea
          aria-label="Critique"
          value={critique}
          onChange={(event) => setCritique(event.target.value)}
          placeholder="What makes one better, or what both get wrong"
          disabled={pending}
          rows={2}
          className="max-h-40 min-h-12"
        />
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </form>
  )
}

function Prompt({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [open, setOpen] = useState(false)
  const [clamped, setClamped] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (el && !open) setClamped(el.scrollHeight > el.clientHeight + 1)
  }, [text, open])

  return (
    <div className="flex flex-col items-start gap-1">
      <p ref={ref} className={cn("text-sm/relaxed whitespace-pre-wrap text-foreground", !open && "line-clamp-4")}>
        {text}
      </p>
      {clamped || open ? (
        <Button type="button" variant="link" size="sm" className="-ml-2 text-muted-foreground" onClick={() => setOpen(!open)}>
          {open ? "Show less" : "Show the full prompt"}
        </Button>
      ) : null}
    </div>
  )
}

function Candidate({ side }: { side: ReviewSide }) {
  return (
    <section className="flex min-w-0 flex-col items-center gap-2">
      <div className="flex w-[280px] items-center justify-end">
        <SourceDialog side={side} />
        <Link href={`/optimize/view/${side.id}`} target="_blank" className={buttonVariants({ variant: "ghost", size: "sm", className: "text-muted-foreground" })}>
          Full size
        </Link>
      </div>
      <Phone side={side} />
    </section>
  )
}

function SourceDialog({ side }: { side: ReviewSide }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="ghost" size="sm" className="text-muted-foreground" />}>Source</DialogTrigger>
      <DialogContent className="flex h-[85vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{side.title}</DialogTitle>
          <DialogDescription className="font-mono">
            {side.lang} · {side.promptVersion}
          </DialogDescription>
        </DialogHeader>
        <CodeBlock className="min-h-0 flex-1">
          <CodeBlockHeader className="justify-end">
            <CodeBlockCopyButton value={side.source} />
          </CodeBlockHeader>
          <CodeBlockContent lineNumbers className="min-h-0 flex-1">
            {side.source}
          </CodeBlockContent>
        </CodeBlock>
      </DialogContent>
    </Dialog>
  )
}

const PHONE_WIDTH = 390
const PHONE_HEIGHT = 844
const PREVIEW_WIDTH = 280
const SCALE = PREVIEW_WIDTH / PHONE_WIDTH

function Phone({ side }: { side: ReviewSide }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-foreground/10"
      style={{ width: PREVIEW_WIDTH, height: PHONE_HEIGHT * SCALE }}
    >
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT, transform: `scale(${SCALE})` }}>
        {side.lang === "react" ? (
          <iframe
            title={side.title}
            sandbox="allow-scripts allow-same-origin"
            src={`/api/optimize/candidates/${side.id}/index.html`}
            className="block h-full w-full border-0 bg-white"
          />
        ) : (
          <OpenUICandidate source={side.source} />
        )}
      </div>
    </div>
  )
}
