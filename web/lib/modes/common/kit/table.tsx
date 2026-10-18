import { isValidElement, type ReactNode } from "react"

const NUMERIC = /^[-+−]?[$€£¥₹]?\s?\d[\d,]*(\.\d+)?\s?(%|[kKmMbB]|bn)?$/

function classes(...names: (string | false | null | undefined)[]) {
  return names.filter(Boolean).join(" ")
}

export function Table({ columns, rows }: { columns: string[]; rows: unknown[][] }) {
  const head = columns.map((column) => String(column ?? ""))
  const body = rows.filter(Array.isArray)
  const numeric = head.map((_, column) => {
    const cells = body.map((row) => row[column]).filter((value) => value != null && value !== "" && !(typeof value === "string" && /^(n\/a|\u2014|\u2013|-)$/i.test(value.trim())))
    return cells.length > 0 && cells.every((value) => typeof value === "number" || (typeof value === "string" && NUMERIC.test(value.trim())))
  })
  const cell = (value: unknown): ReactNode => {
    if (isValidElement(value) || Array.isArray(value)) return value as ReactNode
    if (typeof value === "number") return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
    return String(value ?? "")
  }
  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-2xl bg-muted">
      <table className="w-full border-collapse text-sm leading-normal text-foreground">
        <thead>
          <tr>
            {head.map((column, index) => (
              <th key={index} className={classes("px-4 py-3.5 text-left text-sm font-medium whitespace-nowrap text-muted-foreground", numeric[index] && "text-right tabular-nums")}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-border">
              {head.map((_, column) => (
                <td key={column} className={classes("px-4 py-3.5 text-left align-middle", numeric[column] && "text-right whitespace-nowrap tabular-nums")}>
                  {cell(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
