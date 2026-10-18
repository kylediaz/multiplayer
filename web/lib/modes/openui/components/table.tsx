import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { inline } from "./markdown";
import { cx } from "./style";

const NUMERIC = /^[-+−]?[$€£¥₹]?\s?\d[\d,]*(\.\d+)?\s?(%|[kKmMbB]|bn)?$/;
const isElement = (value: unknown) => !!value && typeof value === "object" && (value as { type?: unknown }).type === "element";

export const Table = defineComponent({
  name: "Table",
  props: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.any())),
  }),
  description: "Each row lists its cells in column order; a cell may be a component. Number columns align right.",
  component: ({ props, renderNode }) => {
    const columns = Array.isArray(props.columns) ? props.columns.map((c) => String(c ?? "")) : [];
    const rows = (Array.isArray(props.rows) ? props.rows : []).filter(Array.isArray) as unknown[][];
    // A column of numbers (or amounts like "$1.2k" and "45%") aligns right.
    const numeric = columns.map((_, c) => {
      const cells = rows.map((r) => r[c]).filter((v) => v != null && v !== "" && !(typeof v === "string" && /^(n\/a|\u2014|\u2013|-)$/i.test(v.trim())));
      return cells.length > 0 && cells.every((v) => typeof v === "number" || (typeof v === "string" && NUMERIC.test(v.trim())));
    });
    const cell = (value: unknown) =>
      isElement(value) ? renderNode(value) : typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : inline(String(value ?? ""));
    return (
      <div className="w-full min-w-0 overflow-x-auto rounded-[14px] border border-border">
        <table className="w-full border-collapse text-sm leading-normal text-foreground">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} className={cx("border-b border-border bg-muted px-4 py-[11px] text-left text-[13px] font-medium whitespace-nowrap", numeric[i] && "text-right tabular-nums")}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {rows.map((row, r) => (
              <tr key={r} className="hover:bg-muted/70">
                {columns.map((_, c) => (
                  <td key={c} className={cx("border-b border-border px-4 py-[13px] text-left align-middle", numeric[c] && "text-right whitespace-nowrap tabular-nums")}>
                    {cell(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
});
