export function isLocal(): boolean {
  return process.env.NODE_ENV === "development"
}

export function notFoundResponse(): Response {
  return Response.json({ error: "not found" }, { status: 404 })
}
