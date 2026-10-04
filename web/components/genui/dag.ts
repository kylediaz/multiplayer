export type DAGLayoutOptions = {
  nodes: Array<{ id: string }>
  edges: Array<{ from: string; to: string }>
  direction?: "vertical" | "horizontal"
  nodeWidth?: number
  nodeHeight?: number
  rankGap?: number
  nodeGap?: number
  padding?: number
}

export type DAGLayoutNode = { id: string; x: number; y: number; rank: number; order: number }
export type DAGLayoutEdge = {
  from: string
  to: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  isBackEdge: boolean
}
export type DAGLayoutRank = { rank: number; x: number; y: number; width: number; height: number; nodeIds: string[] }
export type DAGLayoutResult = {
  nodes: DAGLayoutNode[]
  edges: DAGLayoutEdge[]
  ranks: DAGLayoutRank[]
  direction: "vertical" | "horizontal"
  width: number
  height: number
}

export function computeDAGLayout(options: DAGLayoutOptions): DAGLayoutResult {
  const direction = options.direction ?? "vertical"
  const nodeWidth = options.nodeWidth ?? 160
  const nodeHeight = options.nodeHeight ?? 40
  const rankGap = options.rankGap ?? 64
  const nodeGap = options.nodeGap ?? 48
  const padding = options.padding ?? 24
  const ids = new Set(options.nodes.map((node) => node.id))
  const edges = options.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to))

  const outgoing = new Map<string, string[]>(options.nodes.map((node) => [node.id, []]))
  for (const edge of edges) outgoing.get(edge.from)?.push(edge.to)

  const state = new Map<string, 0 | 1 | 2>()
  const back = new Set<string>()
  const visit = (id: string) => {
    state.set(id, 1)
    for (const next of outgoing.get(id) ?? []) {
      const seen = state.get(next) ?? 0
      if (seen === 1) back.add(`${id}->${next}`)
      else if (seen === 0) visit(next)
    }
    state.set(id, 2)
  }
  for (const node of options.nodes) if ((state.get(node.id) ?? 0) === 0) visit(node.id)

  const forward = edges.filter((edge) => !back.has(`${edge.from}->${edge.to}`))
  const indegree = new Map(options.nodes.map((node) => [node.id, 0]))
  const forwardOut = new Map<string, string[]>()
  for (const edge of forward) {
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1)
    const list = forwardOut.get(edge.from) ?? []
    list.push(edge.to)
    forwardOut.set(edge.from, list)
  }
  const rank = new Map<string, number>()
  const queue = options.nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id)
  for (const id of queue) rank.set(id, 0)
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index]
    for (const next of forwardOut.get(id) ?? []) {
      rank.set(next, Math.max(rank.get(next) ?? 0, (rank.get(id) ?? 0) + 1))
      indegree.set(next, (indegree.get(next) ?? 1) - 1)
      if (indegree.get(next) === 0) queue.push(next)
    }
  }
  for (const node of options.nodes) if (!rank.has(node.id)) rank.set(node.id, 0)

  const groups = new Map<number, string[]>()
  for (const node of options.nodes) {
    const layer = rank.get(node.id) ?? 0
    const list = groups.get(layer) ?? []
    list.push(node.id)
    groups.set(layer, list)
  }
  const layers = [...groups.keys()].sort((a, b) => a - b)
  const layerIndex = new Map(layers.map((layer, index) => [layer, index]))
  const order = new Map<string, number>()
  for (const layer of layers) groups.get(layer)?.forEach((id, index) => order.set(id, index))

  const maxCount = Math.max(1, ...layers.map((layer) => groups.get(layer)?.length ?? 0))
  const alongSize = direction === "vertical" ? nodeHeight : nodeWidth
  const acrossSize = direction === "vertical" ? nodeWidth : nodeHeight
  const along = (index: number) => padding + index * (alongSize + rankGap)
  const across = (index: number, count: number) => {
    const span = maxCount * acrossSize + (maxCount - 1) * nodeGap
    const row = count * acrossSize + (count - 1) * nodeGap
    return padding + (span - row) / 2 + index * (acrossSize + nodeGap)
  }

  const nodes: DAGLayoutNode[] = options.nodes.map((node) => {
    const layer = rank.get(node.id) ?? 0
    const place = order.get(node.id) ?? 0
    const count = groups.get(layer)?.length ?? 1
    const main = along(layerIndex.get(layer) ?? 0)
    const side = across(place, count)
    return {
      id: node.id,
      x: direction === "vertical" ? side : main,
      y: direction === "vertical" ? main : side,
      rank: layer,
      order: place,
    }
  })
  const byId = new Map(nodes.map((node) => [node.id, node]))

  const laidEdges: DAGLayoutEdge[] = edges.flatMap((edge) => {
    const from = byId.get(edge.from)
    const to = byId.get(edge.to)
    if (!from || !to) return []
    return [{
      from: edge.from,
      to: edge.to,
      sourceX: from.x + (direction === "vertical" ? nodeWidth / 2 : nodeWidth),
      sourceY: from.y + (direction === "vertical" ? nodeHeight : nodeHeight / 2),
      targetX: to.x + (direction === "vertical" ? nodeWidth / 2 : 0),
      targetY: to.y + (direction === "vertical" ? 0 : nodeHeight / 2),
      isBackEdge: back.has(`${edge.from}->${edge.to}`),
    }]
  })

  const ranks: DAGLayoutRank[] = layers.map((layer) => {
    const nodeIds = groups.get(layer) ?? []
    const boxes = nodeIds.flatMap((id) => {
      const box = byId.get(id)
      return box ? [box] : []
    })
    const x = Math.min(...boxes.map((box) => box.x))
    const y = Math.min(...boxes.map((box) => box.y))
    const right = Math.max(...boxes.map((box) => box.x + nodeWidth))
    const bottom = Math.max(...boxes.map((box) => box.y + nodeHeight))
    return { rank: layer, x, y, width: right - x, height: bottom - y, nodeIds }
  })

  const layerCount = layers.length
  const width = padding * 2 + (direction === "vertical" ? maxCount * nodeWidth + (maxCount - 1) * nodeGap : layerCount * nodeWidth + Math.max(0, layerCount - 1) * rankGap)
  const height = padding * 2 + (direction === "vertical" ? layerCount * nodeHeight + Math.max(0, layerCount - 1) * rankGap : maxCount * nodeHeight + (maxCount - 1) * nodeGap)
  return { nodes, edges: laidEdges, ranks, direction, width, height }
}
