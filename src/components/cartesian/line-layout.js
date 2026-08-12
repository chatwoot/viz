import { createCartesianLayout, finiteNumber } from './cartesian-layout.js'

const AXIS_CHARACTER_WIDTH = 7

function accessorValue(accessor, datum, index) {
  return typeof accessor === 'function' ? accessor(datum, index) : accessor
}

function formattedValue(formatter, value, datum, series) {
  const localeValue = Number(value).toLocaleString()

  if (typeof formatter === 'function') return String(formatter(value, datum, series))
  if (typeof formatter !== 'string') return localeValue
  if (formatter.includes('{value}')) return formatter.replaceAll('{value}', localeValue)
  return `${localeValue}${formatter}`
}

function cssIdentifier(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function defaultSeriesColor(id, index) {
  const identifier = cssIdentifier(id)
  const fallback = index === 0 ? '#8b8d98' : index === 1 ? '#009688' : '#3e63dd'
  const indexVariable = `var(--cw-viz-line-series-${index}-color, ${fallback})`

  return identifier
    ? `var(--cw-viz-line-series-${identifier}-color, ${indexVariable})`
    : indexVariable
}

function linePath(points) {
  let isSegmentOpen = false

  return points
    .map((point) => {
      if (!point) {
        isSegmentOpen = false
        return ''
      }

      const command = isSegmentOpen ? 'L' : 'M'
      isSegmentOpen = true
      return `${command} ${point.x} ${point.y}`
    })
    .filter(Boolean)
    .join(' ')
}

function trimLabel(label, maximumWidth) {
  const maximumCharacters = Math.max(Math.floor(maximumWidth / AXIS_CHARACTER_WIDTH), 1)
  if (label.length <= maximumCharacters) return label
  if (maximumCharacters <= 1) return '…'
  return `${label.slice(0, maximumCharacters - 1).trimEnd()}…`
}

function labelY(point, seriesIndex, plot) {
  const labelOffset = 16
  const preferBelow = seriesIndex % 2 === 1
  const below = point.y + labelOffset
  const above = point.y - labelOffset

  if (preferBelow && below <= plot.bottom - 2) return below
  if (!preferBelow && above >= plot.top + 2) return above
  return preferBelow ? above : below
}

export function createLineLayout({
  categoryLabel,
  data,
  formatValue,
  height,
  pointValue,
  seriesColor,
  seriesId,
  seriesLabel,
  seriesPointBorderColor,
  seriesPointColor,
  seriesValueColor,
  seriesValues,
  width,
  xInset,
  yDomain,
  yTickCount,
  yTicks,
}) {
  const inputCategories = Array.isArray(data?.categories) ? data.categories : []
  const inputSeries = Array.isArray(data?.series) ? data.series : []

  if (!inputCategories.length || !inputSeries.length) {
    return { categories: [], domain: [0, 1], error: '', plot: {}, series: [], yTicks: [] }
  }

  const categories = inputCategories.map((datum, index) => ({
    datum,
    index,
    label: String(categoryLabel(datum, index) ?? index + 1),
  }))
  const normalizedSeries = inputSeries.map((datum, seriesIndex) => {
    const id = seriesId(datum, seriesIndex) ?? seriesIndex
    const inputPoints = accessorValue(seriesValues, datum, seriesIndex)
    const color =
      accessorValue(seriesColor, datum, seriesIndex) || defaultSeriesColor(id, seriesIndex)
    const pointBorderColor =
      accessorValue(seriesPointBorderColor, datum, seriesIndex) ||
      'var(--cw-viz-line-point-border-color, #ffffff)'

    return {
      color,
      datum,
      id,
      index: seriesIndex,
      label: String(seriesLabel(datum, seriesIndex) ?? id),
      pointBorderColor,
      pointColor: accessorValue(seriesPointColor, datum, seriesIndex) || color,
      rawPoints: Array.isArray(inputPoints) ? inputPoints : [],
      valueColor: accessorValue(seriesValueColor, datum, seriesIndex) || color,
    }
  })
  const values = normalizedSeries.flatMap((series) =>
    series.rawPoints.slice(0, categories.length).flatMap((datum, pointIndex) => {
      const value = finiteNumber(pointValue(datum, pointIndex, series.datum))
      return value === undefined ? [] : [value]
    }),
  )
  const cartesian = createCartesianLayout({
    categoryCount: categories.length,
    height,
    values,
    width,
    xInset,
    yDomain,
    yTickCount,
    yTicks,
  })

  categories.forEach((category, index) => {
    category.x = cartesian.xPositions[index]
    category.displayLabel = trimLabel(
      category.label,
      Math.max(cartesian.xStep || cartesian.plot.width, 1) - 12,
    )
  })

  normalizedSeries.forEach((series) => {
    series.points = categories.map((category, pointIndex) => {
      const datum = series.rawPoints[pointIndex]
      const value = finiteNumber(pointValue(datum, pointIndex, series.datum))

      if (value === undefined) return null

      const point = {
        category,
        datum,
        index: pointIndex,
        value,
        x: category.x,
        y: cartesian.mapY(value),
      }
      point.formattedValue = formattedValue(formatValue, value, datum, series.datum)
      point.labelY = labelY(point, series.index, cartesian.plot)
      return point
    })
    series.path = linePath(series.points)
  })

  return {
    categories,
    domain: cartesian.domain,
    error: values.length ? '' : 'Line chart data must include at least one numeric value.',
    plot: cartesian.plot,
    series: normalizedSeries,
    yTicks: cartesian.yTicks.map((tick) => ({
      formattedValue: formattedValue(formatValue, tick.value),
      value: tick.value,
      y: tick.y,
    })),
  }
}
