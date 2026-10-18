import { defineComponent } from "@openuidev/react-lang";
import katex from "katex";
import { Fragment, type ReactNode } from "react";
import { z } from "zod";
import "katex/dist/katex.min.css";

function webUrl(value: string): string | null {
  try {
    const protocol = new URL(value.trim()).protocol;
    return protocol === "http:" || protocol === "https:" ? value.trim() : null;
  } catch {
    return null;
  }
}

// A small Markdown renderer. Prose is React elements. Math is KaTeX's own HTML.
// Inline: **bold**, *italic*, ~~strike~~, `code`, [text](https://...), $math$.
// Blocks: paragraphs, # headings, - and 1. lists, > quotes, ``` code, $$ math $$, ---, | tables |.

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*|__[^_\n]+?__)|(~~[^~\n]+?~~)|(\*[^*\s][^*\n]*?\*|_[^_\s][^_\n]*?_)|(\[[^\]\n]+\]\([^)\s]+\))|(\$(?=[^$\n]*[A-Za-z\\^_=])[^$\n]+\$)/;

function MathTex({ tex, display }: { tex: string; display?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: !!display, trust: false });
  return display ? (
    <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export function inline(text: string, key = "i"): ReactNode {
  const out: ReactNode[] = [];
  let rest = text;
  let n = 0;
  while (rest) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push(rest);
      break;
    }
    if (m.index) out.push(rest.slice(0, m.index));
    const token = m[0];
    const k = `${key}-${n++}`;
    if (m[1]) out.push(<code key={k} className="rounded-[5px] bg-muted px-[5px] py-px font-mono text-[0.88em]">{token.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={k}>{inline(token.slice(2, -2), k)}</strong>);
    else if (m[3]) out.push(<s key={k}>{inline(token.slice(2, -2), k)}</s>);
    else if (m[4]) out.push(<em key={k}>{inline(token.slice(1, -1), k)}</em>);
    else if (m[6]) out.push(<MathTex key={k} tex={token.slice(1, -1)} />);
    else {
      const close = token.indexOf("](");
      const label = token.slice(1, close);
      const href = webUrl(token.slice(close + 2, -1));
      out.push(
        href ? (
          <a key={k} className="text-inherit underline decoration-border underline-offset-[3px] hover:decoration-current" href={href} target="_blank" rel="noopener noreferrer">
            {inline(label, k)}
          </a>
        ) : (
          <Fragment key={k}>{inline(label, k)}</Fragment>
        ),
      );
    }
    rest = rest.slice(m.index + token.length);
  }
  return out.length === 1 ? out[0] : out;
}

type Block =
  | { kind: "p" | "quote"; text: string }
  | { kind: "h"; level: number; text: string }
  | { kind: "list"; ordered: boolean; start: number; items: string[] }
  | { kind: "code" | "math"; text: string }
  | { kind: "hr" }
  | { kind: "table"; head: string[]; rows: string[][] };

const LIST_ITEM = /^\s{0,3}([-*+]|(\d+)[.)])\s+(.*)$/;
const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

function blocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^\s*```/.test(line)) {
      const body: string[] = [];
      for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) body.push(lines[i]);
      out.push({ kind: "code", text: body.join("\n") });
      i++;
      continue;
    }
    if (/^\s*\$\$\s*$/.test(line)) {
      const body: string[] = [];
      for (i++; i < lines.length && !/^\s*\$\$\s*$/.test(lines[i]); i++) body.push(lines[i]);
      out.push({ kind: "math", text: body.join("\n") });
      i++;
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      out.push({ kind: "h", level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      out.push({ kind: "hr" });
      i++;
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const head = cells(line);
      const rows: string[][] = [];
      for (i += 2; i < lines.length && lines[i].includes("|") && lines[i].trim(); i++) rows.push(cells(lines[i]));
      out.push({ kind: "table", head, rows });
      continue;
    }
    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      for (; i < lines.length && /^\s*>/.test(lines[i]); i++) body.push(lines[i].replace(/^\s*>\s?/, ""));
      out.push({ kind: "quote", text: body.join(" ") });
      continue;
    }
    const item = LIST_ITEM.exec(line);
    if (item) {
      const ordered = !!item[2];
      const items: string[] = [];
      for (; i < lines.length; i++) {
        const next = LIST_ITEM.exec(lines[i]);
        if (next && !!next[2] === ordered) items.push(next[3]);
        else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) items[items.length - 1] += ` ${lines[i].trim()}`;
        else break;
      }
      out.push({ kind: "list", ordered, start: ordered ? Number(item[2]) : 1, items });
      continue;
    }
    const body: string[] = [];
    for (; i < lines.length && lines[i].trim() && !LIST_ITEM.test(lines[i]) && !/^(#{1,4})\s|^\s*```|^\s*\$\$|^\s*>/.test(lines[i]); i++) body.push(lines[i].trim());
    out.push({ kind: "p", text: body.join(" ") });
  }
  return out;
}

const headingClass: Record<number, string> = {
  1: "md-h text-[22px] leading-[1.3] font-semibold tracking-[-0.5px] text-foreground",
  2: "md-h text-[19px] leading-[1.35] font-semibold tracking-[-0.3px] text-foreground",
  3: "md-h text-base leading-snug font-semibold text-foreground",
  4: "md-h text-base leading-snug font-semibold text-foreground",
};

const tableScroll = "w-full min-w-0 overflow-x-auto rounded-[14px] border border-border";
const table = "w-full border-collapse text-sm leading-normal text-foreground";
const tableHead = "border-b border-border bg-muted px-4 py-[11px] text-left text-[13px] font-medium whitespace-nowrap";
const tableCell = "border-b border-border px-4 py-[13px] text-left align-middle";

function MarkdownBlocks({ text }: { text: string }) {
  return (
    <>
      {blocks(text).map((b, i) => {
        const k = `b${i}`;
        switch (b.kind) {
          case "p":
            return <p key={k}>{inline(b.text, k)}</p>;
          case "quote":
            return <blockquote key={k} className="rounded-r-xl border-l-[3px] border-border bg-muted px-4 py-3 text-foreground">{inline(b.text, k)}</blockquote>;
          case "h":
            return (
              <div key={k} role="heading" aria-level={b.level + 1} className={headingClass[b.level] ?? headingClass[4]}>
                {inline(b.text, k)}
              </div>
            );
          case "math":
            return <MathTex key={k} tex={b.text} display />;
          case "code":
            return (
              <pre key={k} className="m-0 overflow-x-auto rounded-md bg-muted px-4 py-3.5 font-mono text-[13px] leading-[1.6]">
                <code>{b.text}</code>
              </pre>
            );
          case "hr":
            return <hr key={k} className="my-5 w-full border-0 border-t border-border" />;
          case "list": {
            const items = b.items.map((t, j) => <li key={j} className="pl-0.5 marker:text-muted-foreground">{inline(t, `${k}-${j}`)}</li>);
            return b.ordered ? (
              <ol key={k} start={b.start} className="flex list-decimal flex-col gap-1.5 pl-[1.4em] marker:font-medium marker:tabular-nums">
                {items}
              </ol>
            ) : (
              <ul key={k} className="flex list-disc flex-col gap-1.5 pl-[1.4em]">{items}</ul>
            );
          }
          case "table":
            return (
              <div key={k} className={tableScroll}>
                <table className={table}>
                  <thead>
                    <tr>{b.head.map((h, j) => <th key={j} className={tableHead}>{inline(h, `${k}-h${j}`)}</th>)}</tr>
                  </thead>
                  <tbody className="[&>tr:last-child>td]:border-b-0">
                    {b.rows.map((r, j) => (
                      <tr key={j} className="hover:bg-muted/70">{r.map((c, m) => <td key={m} className={tableCell}>{inline(c, `${k}-${j}-${m}`)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </>
  );
}

function MarkdownView({ text }: { text: string }) {
  return (
    <div className="flex min-w-0 flex-col text-[1em] leading-[1.65] wrap-anywhere text-foreground [&_strong]:font-semibold [&>*]:m-0 [&>*+*]:mt-3 [&>p+:is(ul,ol)]:mt-1.5 [&>*+.md-h]:mt-[26px] [&>.md-h+*]:mt-2">
      <MarkdownBlocks text={text} />
    </div>
  );
}

export const Markdown = defineComponent({
  name: "Markdown",
  props: z.object({ text: z.string() }),
  description: "Prose with headings, lists, quotes, code and tables.",
  component: ({ props }) => <MarkdownView text={typeof props.text === "string" ? props.text : ""} />,
});
