const DEFAULT_TICK_COUNT = 5
const AXIS_CHARACTER_WIDTH = 7

export function accessorValue(accessor, datum, index) {
  return typeof accessor === 'function' ? accessor(datum, index) : accessor
}

export function formatChartValue(formatter, value, datum, series) {
  const localeValue = Number(value).toLocaleString()

  if (typeof formatter === 'function') return String(formatter(value, datum, series))
  if (typeof formatter !== 'string') return localeValue
  if (formatter.includes('{value}')) return formatter.replaceAll('{value}', localeValue)
  return `${localeValue}${formatter}`
}

export function createCartesianItemPayload(series, point, event) {
  return {
    category: point.category.datum,
    categoryIndex: point.category.index,
    categoryLabel: point.category.label,
    event,
    formattedValue: point.formattedValue,
    item: point.datum,
    pointIndex: point.index,
    series: series.datum,
    seriesId: series.id,
    seriesIndex: series.index,
    seriesLabel: series.label,
    value: point.value,
  }
}

function cssIdentifier(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function seriesCssColor(chart, id, index) {
  const identifier = cssIdentifier(id)
  const fallbacks = ['#8b8d98', '#009688', '#3e63dd', '#915930', '#ca244e', '#7c66dc']
  const fallback = fallbacks[index % fallbacks.length]
  const indexVariable = `var(--cw-viz-${chart}-series-${index}-color, ${fallback})`

  return identifier
    ? `var(--cw-viz-${chart}-series-${identifier}-color, ${indexVariable})`
    : indexVariable
}

export function trimAxisLabel(label, maximumWidth) {
  const maximumCharacters = Math.max(Math.floor(maximumWidth / AXIS_CHARACTER_WIDTH), 1)
  if (label.length <= maximumCharacters) return label
  if (maximumCharacters <= 1) return '…'
  return `${label.slice(0, maximumCharacters - 1).trimEnd()}…`
}

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

function stepBoundary(value, step, direction) {
  const quotient = value / step
  const tolerance = Number.EPSILON * Math.max(Math.abs(quotient), 1) * 4
  const roundedQuotient =
    direction === 'down' ? Math.floor(quotient + tolerance) : Math.ceil(quotient - tolerance)
  return roundNumber(roundedQuotient * step, step)
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

function createDomainDetails(values, requestedDomain, includeZero) {
  const requestedMinimum = finiteNumber(requestedDomain?.[0])
  const requestedMaximum = finiteNumber(requestedDomain?.[1])
  const validValues = values
    .map((value) => finiteNumber(value))
    .filter((value) => value !== undefined)

  if (requestedMinimum !== undefined && requestedMaximum !== undefined) {
    return {
      domain: [
        Math.min(requestedMinimum, requestedMaximum),
        Math.max(requestedMinimum, requestedMaximum),
      ],
      isExplicit: true,
      values: validValues,
    }
  }

  let minimum = validValues.length ? Math.min(...validValues) : 0
  let maximum = validValues.length ? Math.max(...validValues) : 1

  if (includeZero) {
    minimum = Math.min(minimum, 0)
    maximum = Math.max(maximum, 0)
  }

  return { domain: [minimum, maximum], isExplicit: false, values: validValues }
}

function paddedDomainSpan([minimum, maximum]) {
  if (minimum !== maximum) return maximum - minimum

  const padding = Math.abs(minimum || 1) * 0.1
  return padding * 2
}

function resolveStepSize(stepSize, context) {
  const value = typeof stepSize === 'function' ? stepSize(context) : stepSize
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function normalizeDomain(details, step) {
  if (details.isExplicit) return { ...details, step }

  let [minimum, maximum] = details.domain
  if (minimum === maximum) {
    const padding = Math.abs(minimum || 1) * 0.1
    minimum -= padding
    maximum += padding
  }

  let domainMinimum = stepBoundary(minimum, step, 'down')
  let domainMaximum = stepBoundary(maximum, step, 'up')

  if (domainMinimum === domainMaximum) {
    domainMinimum = roundNumber(domainMinimum - step, step)
    domainMaximum = roundNumber(domainMaximum + step, step)
  }

  return {
    ...details,
    domain: [domainMinimum, domainMaximum],
    isExplicit: false,
    step,
  }
}

function createTicks(domainDetails, requestedTicks, tickCount, useStepSize) {
  const [minimum, maximum] = domainDetails.domain
  const explicitTicks = requestedTicks.filter((value) => value >= minimum && value <= maximum)

  if (explicitTicks.length) return explicitTicks

  if (domainDetails.isExplicit && !useStepSize) {
    if (minimum === maximum) return [minimum]

    const intervals = Math.max(Math.floor(tickCount) - 1, 1)
    const step = (maximum - minimum) / intervals
    return Array.from({ length: intervals + 1 }, (_, index) =>
      roundNumber(minimum + step * index, step),
    )
  }

  const ticks = []
  const step = domainDetails.step
  const firstTick = stepBoundary(minimum, step, 'up')

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
  yStepSize,
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
  const initialDomainDetails = createDomainDetails(values, yDomain, includeZero)
  const requestedTicks = Array.isArray(yTicks)
    ? yTicks.map((value) => finiteNumber(value)).filter((value) => value !== undefined)
    : []
  const requestedStep = requestedTicks.length
    ? undefined
    : resolveStepSize(yStepSize, {
        max: initialDomainDetails.domain[1],
        min: initialDomainDetails.domain[0],
        tickCount,
        values: [...initialDomainDetails.values],
      })
  const step = requestedStep ?? niceStep(paddedDomainSpan(initialDomainDetails.domain), tickCount)
  const normalizedDomain = normalizeDomain(initialDomainDetails, step)
  const [domainMinimum, domainMaximum] = normalizedDomain.domain
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
    domain: normalizedDomain.domain,
    mapY,
    plot,
    xPositions: pointScale.positions,
    xStep: pointScale.step,
    yTicks: createTicks(
      normalizedDomain,
      requestedTicks,
      tickCount,
      requestedStep !== undefined,
    ).map((value) => ({
      value,
      y: mapY(value),
    })),
  }
}
