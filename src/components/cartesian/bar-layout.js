import {
  accessorValue,
  createBandScale,
  createCartesianLayout,
  finiteNumber,
  formatChartValue,
  seriesCssColor,
  trimAxisLabel,
} from './cartesian-layout.js'

const MIN_TIME_LABEL_WIDTH = 72

function roundedBarPath({ height, radius, roundBottom, roundTop, width, y }) {
  if (height <= 0 || width <= 0) return ''

  const maximumRadius = Math.min(Math.max(radius, 0), width / 2, height / 2)
  const topRadius = roundTop ? maximumRadius : 0
  const bottomRadius = roundBottom ? maximumRadius : 0
  const left = -width / 2
  const right = width / 2
  const bottom = y + height

  return [
    `M ${left + topRadius} ${y}`,
    `H ${right - topRadius}`,
    `Q ${right} ${y} ${right} ${y + topRadius}`,
    `V ${bottom - bottomRadius}`,
    `Q ${right} ${bottom} ${right - bottomRadius} ${bottom}`,
    `H ${left + bottomRadius}`,
    `Q ${left} ${bottom} ${left} ${bottom - bottomRadius}`,
    `V ${y + topRadius}`,
    `Q ${left} ${y} ${left + topRadius} ${y}`,
    'Z',
  ].join(' ')
}

function stackDomainValues(valueMatrix, categoryCount) {
  return Array.from({ length: categoryCount }, (_, categoryIndex) => {
    let negative = 0
    let positive = 0

    valueMatrix.forEach((values) => {
      const value = values[categoryIndex]
      if (value === undefined) return
      if (value < 0) negative += value
      else positive += value
    })

    return [negative, positive]
  }).flat()
}

function outerStackIndexes(valueMatrix, categoryCount) {
  return Array.from({ length: categoryCount }, (_, categoryIndex) => {
    let negative = -1
    let positive = -1

    valueMatrix.forEach((values, seriesIndex) => {
      const value = values[categoryIndex]
      if (value === undefined || value === 0) return
      if (value < 0) negative = seriesIndex
      else positive = seriesIndex
    })

    return { negative, positive }
  })
}

export function createBarLayout({
  barGap,
  barRadius,
  categoryLabel,
  data,
  formatValue,
  height,
  maxBarWidth,
  pointValue,
  seriesColor,
  seriesId,
  seriesLabel,
  seriesValueColor,
  seriesValues,
  stacked,
  timeseries,
  width,
  yDomain,
  yTickCount,
  yTicks,
}) {
  const inputCategories = Array.isArray(data?.categories) ? data.categories : []
  const inputSeries = Array.isArray(data?.series) ? data.series : []

  if (!inputCategories.length || !inputSeries.length) {
    return {
      categories: [],
      domain: [0, 1],
      error: '',
      plot: {},
      series: [],
      yTicks: [],
      zeroY: 0,
    }
  }

  const categories = inputCategories.map((datum, index) => ({
    datum,
    index,
    label: String(categoryLabel(datum, index) ?? index + 1),
  }))
  const normalizedSeries = inputSeries.map((datum, seriesIndex) => {
    const id = seriesId(datum, seriesIndex) ?? seriesIndex
    const inputPoints = accessorValue(seriesValues, datum, seriesIndex)

    return {
      color:
        accessorValue(seriesColor, datum, seriesIndex) || seriesCssColor('bar', id, seriesIndex),
      datum,
      id,
      index: seriesIndex,
      label: String(seriesLabel(datum, seriesIndex) ?? id),
      rawPoints: Array.isArray(inputPoints) ? inputPoints : [],
      valueColor:
        accessorValue(seriesValueColor, datum, seriesIndex) ||
        'var(--cw-viz-bar-value-color, #60646c)',
    }
  })
  const valueMatrix = normalizedSeries.map((series) =>
    categories.map((_, pointIndex) => {
      const datum = series.rawPoints[pointIndex]
      return finiteNumber(pointValue(datum, pointIndex, series.datum))
    }),
  )
  const numericValues = valueMatrix.flatMap((values) =>
    values.filter((value) => value !== undefined),
  )
  const domainValues = stacked ? stackDomainValues(valueMatrix, categories.length) : numericValues
  const cartesian = createCartesianLayout({
    categoryCount: categories.length,
    height,
    includeZero: true,
    padding: { bottom: 52, left: 52, right: 20, top: 28 },
    values: domainValues,
    width,
    yDomain,
    yTickCount,
    yTicks,
  })
  const categoryScale = createBandScale({
    count: categories.length,
    end: cartesian.plot.right,
    paddingInner: 0.28,
    paddingOuter: 0.14,
    start: cartesian.plot.left,
  })
  const maximumBarWidth = Math.max(finiteNumber(maxBarWidth, 48), 1)
  const requestedGap = Math.max(finiteNumber(barGap, 6), 0)
  const radius = Math.max(finiteNumber(barRadius, 6), 0)
  const stackIndexes = outerStackIndexes(valueMatrix, categories.length)
  const stackOffsets = categories.map(() => ({ negative: 0, positive: 0 }))

  categories.forEach((category, index) => {
    const labelInterval = Math.max(
      Math.ceil(MIN_TIME_LABEL_WIDTH / Math.max(categoryScale.step, 1)),
      1,
    )
    category.bandwidth = categoryScale.bandwidth
    category.x = categoryScale.positions[index] + categoryScale.bandwidth / 2
    category.displayLabel = trimAxisLabel(
      category.label,
      Math.max((categoryScale.step || cartesian.plot.width) * (timeseries ? labelInterval : 1), 1) -
        12,
    )
    const lastIndex = categories.length - 1
    category.showLabel =
      !timeseries ||
      index === 0 ||
      index === lastIndex ||
      (index % labelInterval === 0 && lastIndex - index >= labelInterval)
  })

  const seriesCount = normalizedSeries.length
  const groupedGap = Math.min(requestedGap, categoryScale.bandwidth / Math.max(seriesCount * 2, 1))
  const groupedBarWidth = Math.min(
    maximumBarWidth,
    Math.max((categoryScale.bandwidth - groupedGap * (seriesCount - 1)) / seriesCount, 1),
  )
  const groupedWidth = groupedBarWidth * seriesCount + groupedGap * (seriesCount - 1)
  const stackedBarWidth = Math.min(categoryScale.bandwidth, maximumBarWidth)

  normalizedSeries.forEach((series) => {
    series.points = categories.map((category, pointIndex) => {
      const datum = series.rawPoints[pointIndex]
      const value = valueMatrix[series.index][pointIndex]
      if (value === undefined) return null

      let startValue = 0
      let endValue = value
      let centerX =
        category.x -
        groupedWidth / 2 +
        groupedBarWidth / 2 +
        series.index * (groupedBarWidth + groupedGap)
      let barWidth = groupedBarWidth

      if (stacked) {
        const direction = value < 0 ? 'negative' : 'positive'
        startValue = stackOffsets[pointIndex][direction]
        endValue = startValue + value
        stackOffsets[pointIndex][direction] = endValue
        centerX = category.x
        barWidth = stackedBarWidth
      }

      const startY = cartesian.mapY(startValue)
      const endY = cartesian.mapY(endValue)
      const y = Math.min(startY, endY)
      const barHeight = Math.abs(endY - startY)
      const anchorY = value < 0 ? y + barHeight : y
      const isOuterStack =
        !stacked ||
        (value < 0
          ? stackIndexes[pointIndex].negative === series.index
          : stackIndexes[pointIndex].positive === series.index)
      const labelInside = stacked && barHeight >= 24

      return {
        anchorY,
        category,
        centerX,
        datum,
        endValue,
        formattedValue: formatChartValue(formatValue, value, datum, series.datum),
        height: barHeight,
        index: pointIndex,
        labelInside,
        labelY: labelInside ? y + barHeight / 2 - anchorY : value < 0 ? 14 : -10,
        path: roundedBarPath({
          height: barHeight,
          radius,
          roundBottom: value < 0 && isOuterStack,
          roundTop: value >= 0 && isOuterStack,
          width: barWidth,
          y: y - anchorY,
        }),
        startValue,
        value,
        width: barWidth,
      }
    })
  })

  return {
    categories,
    domain: cartesian.domain,
    error: numericValues.length ? '' : 'Bar chart data must include at least one numeric value.',
    plot: cartesian.plot,
    series: normalizedSeries,
    yTicks: cartesian.yTicks.map((tick) => ({
      formattedValue: formatChartValue(formatValue, tick.value),
      value: tick.value,
      y: tick.y,
    })),
    zeroY: cartesian.mapY(0),
  }
}
