import { PromptForm } from "@/components/doc/prompt-form"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Multiplayer generated UI</h1>
        <p className="text-sm text-muted-foreground">
          Describe an app. It is generated as React, styled with the component library, and shared live.
        </p>
      </div>
      <PromptForm />
    </main>
  )
}
