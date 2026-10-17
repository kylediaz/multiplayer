import { mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Database } from "bun:sqlite"
import { and, eq, gt, max } from "drizzle-orm"
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import type { DocumentLang } from "../shared/lang"
import type { LoggedBatch } from "../shared/sync/protocol"
import type { Schema } from "../shared/sync/schema"
import type { Snapshot } from "./document"
import * as schema from "./schema"
import { documents, ops, revisions, snapshots } from "./schema"

export type DocumentRow = {
  id: string
  title: string
  schema: Schema
  type: DocumentLang
  viewRevision: string | null
  createdAt: number
  headVersion: number
}

export class DataplaneDb {
  private db: BunSQLiteDatabase<typeof schema>

  constructor(file: string) {
    mkdirSync(path.dirname(file), { recursive: true })
    const sqlite = new Database(file)
    sqlite.exec("PRAGMA journal_mode = WAL")
    sqlite.exec("PRAGMA synchronous = NORMAL")
    this.db = drizzle(sqlite, { schema })
    migrate(this.db, { migrationsFolder: path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations") })
  }

  createDocument(doc: { id: string; title: string; schema: Schema; type?: DocumentLang }): DocumentRow {
    this.db
      .insert(documents)
      .values({
        id: doc.id,
        title: doc.title,
        schemaJson: doc.schema,
        type: doc.type ?? "react",
        createdAt: Date.now(),
      })
      .run()
    return this.getDocument(doc.id)!
  }

  getDocument(id: string): DocumentRow | null {
    const row = this.db.select().from(documents).where(eq(documents.id, id)).get()
    if (!row) return null
    return {
      id: row.id,
      title: row.title,
      schema: row.schemaJson,
      type: row.type,
      viewRevision: row.viewRevision,
      createdAt: row.createdAt,
      headVersion: this.headVersion(id),
    }
  }

  updateSchema(id: string, next: Schema) {
    this.db.update(documents).set({ schemaJson: next }).where(eq(documents.id, id)).run()
  }

  addRevision(revision: { id: string; docId: string; schema: Schema }) {
    this.db.transaction((tx) => {
      tx.insert(revisions)
        .values({
          id: revision.id,
          docId: revision.docId,
          schemaJson: revision.schema,
          createdAt: Date.now(),
        })
        .run()
      tx.update(documents).set({ viewRevision: revision.id }).where(eq(documents.id, revision.docId)).run()
    })
  }

  headVersion(docId: string): number {
    const snap = this.db.select({ version: snapshots.version }).from(snapshots).where(eq(snapshots.docId, docId)).get()
    const op = this.db.select({ version: max(ops.version) }).from(ops).where(eq(ops.docId, docId)).get()
    return Math.max(snap?.version ?? 0, op?.version ?? 0)
  }

  loadSnapshot(docId: string): Snapshot | null {
    const row = this.db.select().from(snapshots).where(eq(snapshots.docId, docId)).get()
    if (!row) return null
    return { version: row.version, state: row.stateJson, lastSeq: row.lastSeqJson }
  }

  saveSnapshot(docId: string, snapshot: Snapshot) {
    this.db
      .insert(snapshots)
      .values({
        docId,
        version: snapshot.version,
        stateJson: snapshot.state,
        lastSeqJson: snapshot.lastSeq,
      })
      .onConflictDoUpdate({
        target: snapshots.docId,
        set: {
          version: snapshot.version,
          stateJson: snapshot.state,
          lastSeqJson: snapshot.lastSeq,
        },
      })
      .run()
  }

  appendBatch(docId: string, entry: LoggedBatch) {
    this.db
      .insert(ops)
      .values({
        docId,
        version: entry.version,
        clientId: entry.clientId,
        seq: entry.seq,
        opsJson: entry.ops,
      })
      .run()
  }

  opsSince(docId: string, version: number): LoggedBatch[] {
    const rows = this.db
      .select()
      .from(ops)
      .where(and(eq(ops.docId, docId), gt(ops.version, version)))
      .orderBy(ops.version)
      .all()
    return rows.map((row) => ({
      version: row.version,
      clientId: row.clientId,
      seq: row.seq,
      ops: row.opsJson,
    }))
  }
}
