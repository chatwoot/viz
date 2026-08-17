import {
  accessorValue,
  finiteNumber,
  formatChartValue,
  seriesCssColor,
} from '../cartesian/cartesian-layout.js'

function roundedPercentage(value) {
  return Number(value.toFixed(2))
}

function createSegment({
  color,
  datum,
  description,
  formatPercentage,
  formatValue,
  id,
  index,
  isRemainder,
  label,
  percentage,
  showRawValue,
  sourceIndex,
  value,
}) {
  const displayPercentage = roundedPercentage(percentage)
  const formattedPercentage = formatChartValue(formatPercentage, displayPercentage, datum)
  const formattedValue = formatChartValue(formatValue, value, datum)

  return {
    color,
    datum,
    description: String(description ?? ''),
    formattedPercentage,
    formattedValue,
    id: String(id),
    index,
    isRemainder,
    key: `${String(id)}:${index}`,
    label: String(label ?? ''),
    percentage,
    sourceIndex,
    tooltipValue: showRawValue ? `${formattedValue} · ${formattedPercentage}` : formattedPercentage,
    value,
  }
}

export function createAggregateLayout({
  chartName = 'Aggregate chart',
  colorNamespace = 'aggregate',
  data,
  formatPercentage,
  formatValue,
  remainderColor,
  remainderLabel,
  segmentColor,
  segmentId,
  segmentLabel,
  segmentValue,
}) {
  const sourceSegments = Array.isArray(data?.segments) ? data.segments : []
  const normalizedSegments = sourceSegments.flatMap((datum, sourceIndex) => {
    const value = finiteNumber(accessorValue(segmentValue, datum, sourceIndex))
    if (value === undefined || value < 0) return []

    const id = accessorValue(segmentId, datum, sourceIndex) ?? sourceIndex
    const label = accessorValue(segmentLabel, datum, sourceIndex) ?? `Segment ${sourceIndex + 1}`
    const color =
      accessorValue(segmentColor, datum, sourceIndex) ||
      seriesCssColor(colorNamespace, id, sourceIndex)

    return [{ color, datum, description: datum?.description, id, label, sourceIndex, value }]
  })
  const used = normalizedSegments.reduce((sum, segment) => sum + segment.value, 0)
  const hasExplicitTotal = data?.total !== undefined && data?.total !== null
  const requestedTotal = hasExplicitTotal ? finiteNumber(data.total) : undefined

  if (!Number.isFinite(used)) {
    return {
      error: `${chartName} segment total must be a finite number.`,
      segments: [],
    }
  }

  if (hasExplicitTotal && (requestedTotal === undefined || requestedTotal <= 0)) {
    return {
      error: `${chartName} total must be a positive number.`,
      segments: [],
    }
  }

  if (!hasExplicitTotal && used <= 0) {
    return {
      error: `${chartName} data requires at least one positive segment value.`,
      segments: [],
    }
  }

  const total = hasExplicitTotal ? requestedTotal : used
  const tolerance = Math.max(total, 1) * Number.EPSILON * 16

  if (used - total > tolerance) {
    return {
      error: `${chartName} segment values cannot exceed the total.`,
      segments: [],
      total,
      used,
    }
  }

  const segments = normalizedSegments.map((segment, index) => {
    const percentage = (segment.value / total) * 100
    const showRawValue = hasExplicitTotal || segment.value !== roundedPercentage(percentage)

    return createSegment({
      ...segment,
      formatPercentage,
      formatValue,
      index,
      isRemainder: false,
      percentage,
      showRawValue,
    })
  })
  const remainder = Math.max(total - used, 0)

  if (hasExplicitTotal && remainder > tolerance) {
    segments.push(
      createSegment({
        color: remainderColor,
        datum: null,
        description: '',
        formatPercentage,
        formatValue,
        id: '__remainder',
        index: segments.length,
        isRemainder: true,
        label: remainderLabel,
        percentage: (remainder / total) * 100,
        showRawValue: true,
        sourceIndex: sourceSegments.length,
        value: remainder,
      }),
    )
  }

  return {
    error: '',
    hasExplicitTotal,
    remainder,
    segments,
    total,
    used,
  }
}
