import { PromptForm } from "@/components/doc/prompt-form"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Multiplayer generated UI</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Describe an app. Generate it as React, as OpenUI, or let the model decide. Anyone with the link edits it together.
        </p>
      </header>
      <PromptForm />
    </main>
  )
}
