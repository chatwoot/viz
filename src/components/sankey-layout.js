const MIN_NODE_HEIGHT = 2
const CHART_TOP = 38
const CHART_BOTTOM = 16
const CHART_LEFT = 16
const LABEL_HEIGHT = 26
const LABEL_GAP = 8
const LABEL_PADDING = 8
const CHARACTER_WIDTH = 7

function finiteNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function accessorValue(accessor, datum, index) {
  return typeof accessor === 'function' ? accessor(datum, index) : accessor
}

function cssIdentifier(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function defaultNodeColor(id) {
  const identifier = cssIdentifier(id)
  const nodeVariable = identifier ? `--cw-viz-sankey-node-${identifier}-color` : ''

  return nodeVariable
    ? `var(${nodeVariable}, var(--cw-viz-sankey-node-color, #4747c2))`
    : 'var(--cw-viz-sankey-node-color, #4747c2)'
}

function resolveEndpoint(endpoint, nodes, nodesById, nodesByDatum, nodeId) {
  if (nodesByDatum.has(endpoint)) return nodesByDatum.get(endpoint)
  if (nodesById.has(endpoint)) return nodesById.get(endpoint)

  if (endpoint && typeof endpoint === 'object') {
    const endpointId = nodeId(endpoint)
    if (nodesById.has(endpointId)) return nodesById.get(endpointId)
  }

  if (Number.isInteger(endpoint) && endpoint >= 0 && endpoint < nodes.length) {
    return nodes[endpoint]
  }

  return undefined
}

function assignLayers(nodes) {
  const indegree = new Map(nodes.map((node) => [node, node.targetLinks.length]))
  const queue = nodes.filter((node) => indegree.get(node) === 0)
  let queueIndex = 0
  let processed = 0

  while (queueIndex < queue.length) {
    const node = queue[queueIndex]
    queueIndex += 1
    processed += 1

    node.sourceLinks.forEach((link) => {
      link.target.layer = Math.max(link.target.layer, node.layer + 1)
      const remaining = indegree.get(link.target) - 1
      indegree.set(link.target, remaining)
      if (remaining === 0) queue.push(link.target)
    })
  }

  return processed === nodes.length
}

function ribbonPath(link) {
  const sourceX = link.source.x + link.source.width
  const targetX = link.target.x
  const middleX = sourceX + (targetX - sourceX) / 2
  const sourceBottom = link.sourceY + link.width
  const targetBottom = link.targetY + link.width

  return [
    `M ${sourceX} ${link.sourceY}`,
    `C ${middleX} ${link.sourceY} ${middleX} ${link.targetY} ${targetX} ${link.targetY}`,
    `L ${targetX} ${targetBottom}`,
    `C ${middleX} ${targetBottom} ${middleX} ${sourceBottom} ${sourceX} ${sourceBottom}`,
    'Z',
  ].join(' ')
}

function trimLabel(label, maximumWidth) {
  const maximumCharacters = Math.max(Math.floor(maximumWidth / CHARACTER_WIDTH), 1)
  if (label.length <= maximumCharacters) return label
  if (maximumCharacters <= 1) return '…'
  return `${label.slice(0, maximumCharacters - 1).trimEnd()}…`
}

function createLabel(node, maximumLayer, nextLayerX, width, formatValue) {
  const value = String(formatValue(node.displayValue, node.datum))
  const countWidth = Math.max(value.length * CHARACTER_WIDTH, CHARACTER_WIDTH)
  const isTerminal = node.layer === maximumLayer
  const x = isTerminal ? node.x + node.width + LABEL_GAP : Math.max(4, node.x - LABEL_GAP)
  const maximumWidth = Math.max(
    42,
    Math.min(220, isTerminal ? width - x - 4 : nextLayerX - x - LABEL_GAP),
  )
  const labelTextWidth = Math.max(
    maximumWidth - countWidth - LABEL_PADDING * 2 - LABEL_GAP * 2,
    CHARACTER_WIDTH,
  )
  const text = trimLabel(node.label, labelTextWidth)
  const estimatedWidth =
    text.length * CHARACTER_WIDTH + countWidth + LABEL_PADDING * 2 + LABEL_GAP * 2
  const labelWidth = Math.min(estimatedWidth, maximumWidth)
  const y = isTerminal
    ? Math.max(2, node.y + node.height / 2 - LABEL_HEIGHT / 2)
    : Math.max(2, node.y - LABEL_HEIGHT)

  return {
    countX: labelWidth - LABEL_PADDING,
    height: LABEL_HEIGHT,
    isTerminal,
    labelX: LABEL_PADDING,
    separatorX: labelWidth - countWidth - LABEL_PADDING - LABEL_GAP,
    text,
    value,
    width: labelWidth,
    x,
    y,
  }
}

export function createSankeyLayout({
  data,
  formatValue,
  height,
  linkColor,
  linkValue,
  nodeColor,
  nodeId,
  nodeLabel,
  nodePadding,
  nodeValue,
  nodeWidth,
  width,
}) {
  const inputNodes = Array.isArray(data?.nodes) ? data.nodes : []
  const inputLinks = Array.isArray(data?.links) ? data.links : []

  if (!inputNodes.length) {
    return { error: '', links: [], nodes: [] }
  }

  const nodesById = new Map()
  const nodesByDatum = new Map()
  const duplicateIds = new Set()
  const nodes = inputNodes.map((datum, index) => {
    const accessedId = nodeId(datum, index)
    const id = accessedId ?? index
    const displayValue = Math.max(finiteNumber(nodeValue(datum, index)), 0)
    const accessedColor = accessorValue(nodeColor, datum, index)
    const node = {
      color: accessedColor || defaultNodeColor(id),
      datum,
      displayValue,
      id,
      index,
      label: String(nodeLabel(datum, index) ?? id),
      layer: 0,
      sourceLinks: [],
      targetLinks: [],
    }

    if (nodesById.has(id)) duplicateIds.add(id)
    nodesById.set(id, node)
    nodesByDatum.set(datum, node)
    return node
  })

  if (duplicateIds.size) {
    return {
      error: `Sankey node ids must be unique: ${[...duplicateIds].join(', ')}`,
      links: [],
      nodes: [],
    }
  }

  const invalidLinks = []
  const links = inputLinks.flatMap((datum, index) => {
    const source = resolveEndpoint(datum.source, nodes, nodesById, nodesByDatum, nodeId)
    const target = resolveEndpoint(datum.target, nodes, nodesById, nodesByDatum, nodeId)
    const accessedValue = linkValue(datum, index)
    const value = accessedValue == null ? 1 : Number(accessedValue)

    if (!source || !target) {
      invalidLinks.push(`link ${index} references an unknown node`)
      return []
    }
    if (source === target) {
      invalidLinks.push(`link ${index} is a self-reference`)
      return []
    }
    if (!Number.isFinite(value) || value <= 0) {
      invalidLinks.push(`link ${index} must have a positive numeric value`)
      return []
    }

    const accessedColor = accessorValue(linkColor, datum, index)
    const link = {
      color: accessedColor,
      datum,
      index,
      source,
      target,
      value,
    }
    source.sourceLinks.push(link)
    target.targetLinks.push(link)
    return [link]
  })

  if (invalidLinks.length) {
    return {
      error: `Invalid Sankey data: ${invalidLinks.join('; ')}.`,
      links: [],
      nodes: [],
    }
  }

  if (!assignLayers(nodes)) {
    return {
      error: 'Sankey data must be an acyclic directed graph.',
      links: [],
      nodes: [],
    }
  }

  const maximumLayer = Math.max(...nodes.map((node) => node.layer), 0)
  const layers = Array.from({ length: maximumLayer + 1 }, () => [])
  nodes.forEach((node) => layers[node.layer].push(node))

  nodes.forEach((node) => {
    const incomingValue = node.targetLinks.reduce((total, link) => total + link.value, 0)
    const outgoingValue = node.sourceLinks.reduce((total, link) => total + link.value, 0)
    node.value = Math.max(node.displayValue, incomingValue, outgoingValue)
    if (node.displayValue === 0 && node.value > 0) node.displayValue = node.value
  })

  const terminalLabelWidth = Math.min(220, Math.max(104, width * 0.28))
  const plotRight = Math.max(CHART_LEFT + nodeWidth, width - terminalLabelWidth)
  const columnGap = maximumLayer ? (plotRight - CHART_LEFT - nodeWidth) / maximumLayer : 0
  const availableHeight = Math.max(height - CHART_TOP - CHART_BOTTOM, 1)
  const layerPaddings = layers.map((layer) => {
    if (layer.length <= 1) return 0
    const maximumPadding = (availableHeight - layer.length * MIN_NODE_HEIGHT) / (layer.length - 1)
    return Math.max(Math.min(nodePadding, maximumPadding), 0)
  })
  const scale = Math.min(
    ...layers.map((layer, index) => {
      const total = layer.reduce((sum, node) => sum + node.value, 0)
      const padding = Math.max(layer.length - 1, 0) * layerPaddings[index]
      const zeroValueHeight = layer.filter((node) => node.value === 0).length * MIN_NODE_HEIGHT
      return total > 0 ? Math.max(availableHeight - padding - zeroValueHeight, 1) / total : 1
    }),
  )

  layers.forEach((layer, layerIndex) => {
    const nodeHeights = layer.map((node) => Math.max(node.value * scale, MIN_NODE_HEIGHT))
    const blockHeight =
      nodeHeights.reduce((total, nodeHeight) => total + nodeHeight, 0) +
      Math.max(layer.length - 1, 0) * layerPaddings[layerIndex]
    let y = CHART_TOP + Math.max((availableHeight - blockHeight) / 2, 0)

    layer.forEach((node, index) => {
      node.height = nodeHeights[index]
      node.width = nodeWidth
      node.x = CHART_LEFT + columnGap * layerIndex
      node.y = y
      y += node.height + layerPaddings[layerIndex]
    })
  })

  nodes.forEach((node) => {
    node.sourceLinks.sort((first, second) => first.target.y - second.target.y)
    node.targetLinks.sort((first, second) => first.source.y - second.source.y)

    const sourceWidth = node.sourceLinks.reduce((sum, link) => sum + link.value * scale, 0)
    const targetWidth = node.targetLinks.reduce((sum, link) => sum + link.value * scale, 0)
    let sourceY = node.y + Math.max((node.height - sourceWidth) / 2, 0)
    let targetY = node.y + Math.max((node.height - targetWidth) / 2, 0)

    node.sourceLinks.forEach((link) => {
      link.sourceY = sourceY
      sourceY += link.value * scale
    })
    node.targetLinks.forEach((link) => {
      link.targetY = targetY
      targetY += link.value * scale
    })
  })

  links.forEach((link) => {
    link.width = link.value * scale
    link.color = link.color || link.target.color
    link.path = ribbonPath(link)
  })

  nodes.forEach((node) => {
    const nextLayerX = node.layer < maximumLayer ? layers[node.layer + 1][0].x : width
    node.labelLayout = createLabel(node, maximumLayer, nextLayerX, width, formatValue)
  })

  return { error: '', links, nodes }
}
