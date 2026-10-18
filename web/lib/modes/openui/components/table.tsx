import { defineComponent } from "@openuidev/react-lang"
import { z } from "zod"
import { Table as TableView } from "../../common/kit/table"
import { inline } from "./markdown"

const isElement = (value: unknown) => !!value && typeof value === "object" && (value as { type?: unknown }).type === "element"

export const Table = defineComponent({
  name: "Table",
  props: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.any())),
  }),
  description: "Each row lists its cells in column order; a cell may be a component. Number columns align right.",
  component: ({ props, renderNode }) => {
    const columns = Array.isArray(props.columns) ? props.columns.map((column) => String(column ?? "")) : []
    const rows = (Array.isArray(props.rows) ? props.rows : []).filter(Array.isArray) as unknown[][]
    return (
      <TableView
        columns={columns}
        rows={rows.map((row) =>
          columns.map((_, index) => {
            const value = row[index]
            if (isElement(value)) return renderNode(value)
            if (typeof value === "number") return value
            return inline(String(value ?? ""))
          }),
        )}
      />
    )
  },
})
