"use client"

import dynamic from "next/dynamic"
import { sampleId, samples, type ComponentSample } from "./samples"

const Preview = dynamic(() => import("./preview").then((mod) => mod.Preview), {
  ssr: false,
  loading: () => <div className="h-24 animate-pulse rounded-xl bg-muted" />,
})

const groups = samples.reduce<{ name: string; items: ComponentSample[] }[]>((list, sample) => {
  const current = list.at(-1)
  if (current?.name === sample.group) current.items.push(sample)
  else list.push({ name: sample.group, items: [sample] })
  return list
}, [])

export function Gallery() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="max-w-xl">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Components</h1>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          Every OpenUI component, rendered with the library as it ships.
        </p>
      </header>
      <nav className="sticky top-0 z-10 -mx-6 mt-8 flex gap-4 overflow-x-auto bg-background/90 px-6 py-3 backdrop-blur lg:hidden">
        {groups.map((group) => (
          <div key={group.name} className="flex shrink-0 items-center gap-2">
            {group.items.map((sample) => (
              <a key={sample.name} href={`#${sampleId(sample.name)}`} className="text-sm text-muted-foreground">
                {sample.name}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <div className="mt-10 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-16">
        <nav className="sticky top-8 hidden max-h-[calc(100dvh-4rem)] self-start overflow-y-auto lg:block">
          {groups.map((group) => (
            <div key={group.name} className="mb-5">
              <p className="mb-1 text-xs font-medium text-muted-foreground">{group.name}</p>
              <ul>
                {group.items.map((sample) => (
                  <li key={sample.name}>
                    <a href={`#${sampleId(sample.name)}`} className="block py-0.5 text-sm text-foreground">
                      {sample.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div>
          {groups.map((group) => (
            <section key={group.name} className="mb-14">
              <h2 className="text-sm font-medium text-muted-foreground">{group.name}</h2>
              <div className="mt-6 flex flex-col gap-12">
                {group.items.map((sample) => (
                  <article key={sample.name} id={sampleId(sample.name)} className="scroll-mt-16 grid items-start gap-4 md:grid-cols-[minmax(0,13rem)_minmax(0,26rem)] md:gap-8">
                    <div>
                      <h3 className="text-base font-medium tracking-tight">{sample.name}</h3>
                      <p className="mt-1 text-sm text-pretty text-muted-foreground">{sample.description}</p>
                    </div>
                    <div className="min-w-0 rounded-2xl bg-background p-4 ring-1 ring-foreground/10" style={{ minHeight: sample.minHeight }}>
                      <Preview source={sample.source} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
