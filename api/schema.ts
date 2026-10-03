import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"
import type { Op, DocState } from "../shared/sync/doc"
import type { Schema } from "../shared/sync/schema"

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  schemaJson: text("schema_json", { mode: "json" }).$type<Schema>().notNull(),
  viewRevision: text("view_revision"),
  createdAt: integer("created_at").notNull(),
})

export const revisions = sqliteTable("revisions", {
  id: text("id").primaryKey(),
  docId: text("doc_id").notNull(),
  schemaJson: text("schema_json", { mode: "json" }).$type<Schema>().notNull(),
  createdAt: integer("created_at").notNull(),
})

export const snapshots = sqliteTable("snapshots", {
  docId: text("doc_id").primaryKey(),
  version: integer("version").notNull(),
  stateJson: text("state_json", { mode: "json" }).$type<DocState>().notNull(),
  lastSeqJson: text("last_seq_json", { mode: "json" }).$type<Record<string, number>>().notNull(),
})

export const ops = sqliteTable(
  "ops",
  {
    docId: text("doc_id").notNull(),
    version: integer("version").notNull(),
    clientId: text("client_id").notNull(),
    seq: integer("seq").notNull(),
    opsJson: text("ops_json", { mode: "json" }).$type<Op[]>().notNull(),
  },
  (table) => [primaryKey({ columns: [table.docId, table.version] })]
)
