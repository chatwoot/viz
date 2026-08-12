const DEFAULT_TICK_COUNT = 5

export function finiteNumber(value, fallback = undefined) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function decimalPlaces(value) {
  if (!Number.isFinite(value)) return 0

  const exponent = Math.floor(Math.log10(Math.abs(value) || 1))
  return Math.max(0, -exponent + 1)
}

function roundNumber(value, step) {
  return Number(value.toFixed(decimalPlaces(step)))
}

export function niceStep(span, tickCount = DEFAULT_TICK_COUNT) {
  const intervals = Math.max(Math.floor(tickCount) - 1, 1)
  const roughStep = Math.abs(span) / intervals

  if (!Number.isFinite(roughStep) || roughStep === 0) return 1

  const power = 10 ** Math.floor(Math.log10(roughStep))
  const error = roughStep / power
  const factor = error >= 7.5 ? 10 : error >= 3.5 ? 5 : error >= 1.5 ? 2 : 1
  return factor * power
}

function normalizeDomain(values, requestedDomain, tickCount, includeZero) {
  const requestedMinimum = finiteNumber(requestedDomain?.[0])
  const requestedMaximum = finiteNumber(requestedDomain?.[1])

  if (requestedMinimum !== undefined && requestedMaximum !== undefined) {
    if (requestedMinimum === requestedMaximum) {
      const padding = Math.abs(requestedMinimum || 1) * 0.1
      return {
        domain: [requestedMinimum - padding, requestedMaximum + padding],
        isExplicit: true,
        step: padding,
      }
    }

    return {
      domain: [
        Math.min(requestedMinimum, requestedMaximum),
        Math.max(requestedMinimum, requestedMaximum),
      ],
      isExplicit: true,
      step: Math.abs(requestedMaximum - requestedMinimum) / Math.max(tickCount - 1, 1),
    }
  }

  const validValues = values
    .map((value) => finiteNumber(value))
    .filter((value) => value !== undefined)
  let minimum = validValues.length ? Math.min(...validValues) : 0
  let maximum = validValues.length ? Math.max(...validValues) : 1

  if (includeZero) {
    minimum = Math.min(minimum, 0)
    maximum = Math.max(maximum, 0)
  }

  if (minimum === maximum) {
    const padding = Math.abs(minimum || 1) * 0.1
    minimum -= padding
    maximum += padding
  }

  const step = niceStep(maximum - minimum, tickCount)
  const domainMinimum = Math.floor(minimum / step) * step
  const domainMaximum = Math.ceil(maximum / step) * step

  return {
    domain: [roundNumber(domainMinimum, step), roundNumber(domainMaximum, step)],
    isExplicit: false,
    step,
  }
}

function createTicks(domainDetails, requestedTicks, tickCount) {
  const [minimum, maximum] = domainDetails.domain
  const explicitTicks = Array.isArray(requestedTicks)
    ? requestedTicks
        .map((value) => finiteNumber(value))
        .filter((value) => value !== undefined && value >= minimum && value <= maximum)
    : []

  if (explicitTicks.length) return explicitTicks

  if (domainDetails.isExplicit) {
    const intervals = Math.max(Math.floor(tickCount) - 1, 1)
    const step = (maximum - minimum) / intervals
    return Array.from({ length: intervals + 1 }, (_, index) =>
      roundNumber(minimum + step * index, step),
    )
  }

  const ticks = []
  const step = domainDetails.step
  const firstTick = Math.ceil(minimum / step) * step

  for (let value = firstTick; value <= maximum + step / 2; value += step) {
    ticks.push(roundNumber(value, step))
  }

  return ticks
}

export function createBandScale({ count, end, paddingInner = 0, paddingOuter = 0, start }) {
  const itemCount = Math.max(Math.floor(count), 0)
  const span = Math.max(end - start, 0)

  if (!itemCount) return { bandwidth: 0, positions: [], step: 0 }

  const inner = Math.min(Math.max(paddingInner, 0), 1)
  const outer = Math.max(paddingOuter, 0)
  const step = span / Math.max(itemCount - inner + outer * 2, 1)
  const bandwidth = step * (1 - inner)
  const positions = Array.from({ length: itemCount }, (_, index) => start + step * (outer + index))

  return { bandwidth, positions, step }
}

export function createPointScale({ count, end, inset = 0, start }) {
  const itemCount = Math.max(Math.floor(count), 0)
  const safeInset = Math.min(Math.max(inset, 0), Math.max((end - start) / 2, 0))
  const innerStart = start + safeInset
  const innerEnd = end - safeInset

  if (!itemCount) return { positions: [], step: 0 }
  if (itemCount === 1) return { positions: [(innerStart + innerEnd) / 2], step: 0 }

  const step = (innerEnd - innerStart) / (itemCount - 1)
  return {
    positions: Array.from({ length: itemCount }, (_, index) => innerStart + step * index),
    step,
  }
}

export function createCartesianLayout({
  categoryCount,
  height,
  includeZero = false,
  padding = {},
  values = [],
  width,
  xInset,
  yDomain,
  yTickCount = DEFAULT_TICK_COUNT,
  yTicks,
}) {
  const safeWidth = Math.max(finiteNumber(width, 0), 1)
  const safeHeight = Math.max(finiteNumber(height, 0), 1)
  const plot = {
    bottom: Math.max(safeHeight - finiteNumber(padding.bottom, 48), 1),
    left: Math.min(finiteNumber(padding.left, 52), safeWidth - 1),
    right: Math.max(safeWidth - finiteNumber(padding.right, 20), 1),
    top: Math.min(finiteNumber(padding.top, 24), safeHeight - 1),
  }

  if (plot.right <= plot.left) plot.right = plot.left + 1
  if (plot.bottom <= plot.top) plot.bottom = plot.top + 1

  plot.height = plot.bottom - plot.top
  plot.width = plot.right - plot.left

  const tickCount = Math.max(Math.floor(finiteNumber(yTickCount, DEFAULT_TICK_COUNT)), 2)
  const domainDetails = normalizeDomain(values, yDomain, tickCount, includeZero)
  const [domainMinimum, domainMaximum] = domainDetails.domain
  const domainSpan = domainMaximum - domainMinimum || 1
  const mapY = (value) =>
    plot.bottom - ((finiteNumber(value, domainMinimum) - domainMinimum) / domainSpan) * plot.height
  const pointScale = createPointScale({
    count: categoryCount,
    end: plot.right,
    inset: finiteNumber(xInset, Math.min(56, plot.width * 0.05)),
    start: plot.left,
  })

  return {
    domain: domainDetails.domain,
    mapY,
    plot,
    xPositions: pointScale.positions,
    xStep: pointScale.step,
    yTicks: createTicks(domainDetails, yTicks, tickCount).map((value) => ({
      value,
      y: mapY(value),
    })),
  }
}
