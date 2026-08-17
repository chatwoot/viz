import { createAggregateLayout } from '../aggregate/aggregate-layout.js'

const FULL_CIRCLE = 360
const DEFAULT_DIAMETER = 200
const DEFAULT_THICKNESS = 24
const DEFAULT_SEGMENT_GAP = 3
const DEFAULT_CORNER_RADIUS = 2

function positiveNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

function nonNegativeNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : fallback
}

function degrees(radians) {
  return (radians * 180) / Math.PI
}

function angularOffset(radius, distance) {
  return degrees(Math.asin(Math.min(distance / radius, 1)))
}

function pointOnCircle(center, radius, angle) {
  const radians = (angle * Math.PI) / 180

  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  }
}

function coordinate(value) {
  return Number(value.toFixed(4))
}

function annularPath(
  center,
  innerRadius,
  outerRadius,
  outerStartAngle,
  outerEndAngle,
  innerStartAngle,
  innerEndAngle,
) {
  const outerStart = pointOnCircle(center, outerRadius, outerStartAngle)
  const outerEnd = pointOnCircle(center, outerRadius, outerEndAngle)
  const innerEnd = pointOnCircle(center, innerRadius, innerEndAngle)
  const innerStart = pointOnCircle(center, innerRadius, innerStartAngle)
  const outerSweep = outerEndAngle - outerStartAngle
  const innerSweep = innerEndAngle - innerStartAngle

  if (outerSweep >= FULL_CIRCLE - 0.001) {
    const outerMiddle = pointOnCircle(center, outerRadius, outerStartAngle + FULL_CIRCLE / 2)
    const innerMiddle = pointOnCircle(center, innerRadius, innerStartAngle + FULL_CIRCLE / 2)

    return [
      `M ${coordinate(outerStart.x)} ${coordinate(outerStart.y)}`,
      `A ${coordinate(outerRadius)} ${coordinate(outerRadius)} 0 1 1 ${coordinate(outerMiddle.x)} ${coordinate(outerMiddle.y)}`,
      `A ${coordinate(outerRadius)} ${coordinate(outerRadius)} 0 1 1 ${coordinate(outerEnd.x)} ${coordinate(outerEnd.y)}`,
      `L ${coordinate(innerEnd.x)} ${coordinate(innerEnd.y)}`,
      `A ${coordinate(innerRadius)} ${coordinate(innerRadius)} 0 1 0 ${coordinate(innerMiddle.x)} ${coordinate(innerMiddle.y)}`,
      `A ${coordinate(innerRadius)} ${coordinate(innerRadius)} 0 1 0 ${coordinate(innerStart.x)} ${coordinate(innerStart.y)}`,
      'Z',
    ].join(' ')
  }

  return [
    `M ${coordinate(outerStart.x)} ${coordinate(outerStart.y)}`,
    `A ${coordinate(outerRadius)} ${coordinate(outerRadius)} 0 ${outerSweep > 180 ? 1 : 0} 1 ${coordinate(outerEnd.x)} ${coordinate(outerEnd.y)}`,
    `L ${coordinate(innerEnd.x)} ${coordinate(innerEnd.y)}`,
    `A ${coordinate(innerRadius)} ${coordinate(innerRadius)} 0 ${innerSweep > 180 ? 1 : 0} 0 ${coordinate(innerStart.x)} ${coordinate(innerStart.y)}`,
    'Z',
  ].join(' ')
}

export function createDonutLayout({
  cornerRadius = DEFAULT_CORNER_RADIUS,
  data,
  diameter = DEFAULT_DIAMETER,
  formatPercentage,
  formatValue,
  remainderColor,
  remainderLabel,
  segmentColor,
  segmentGap = DEFAULT_SEGMENT_GAP,
  segmentId,
  segmentLabel,
  segmentValue,
  thickness = DEFAULT_THICKNESS,
}) {
  const safeDiameter = positiveNumber(diameter, DEFAULT_DIAMETER)
  const safeThickness = Math.min(positiveNumber(thickness, DEFAULT_THICKNESS), safeDiameter / 2)
  const safeSegmentGap = nonNegativeNumber(segmentGap, DEFAULT_SEGMENT_GAP)
  const safeCornerRadius = Math.min(
    nonNegativeNumber(cornerRadius, DEFAULT_CORNER_RADIUS),
    safeThickness / 4,
  )
  const center = safeDiameter / 2
  const outerRadius = center - safeCornerRadius
  const innerRadius = Math.max(center - safeThickness + safeCornerRadius, 0.001)
  const radius = (outerRadius + innerRadius) / 2
  const layout = createAggregateLayout({
    chartName: 'Donut chart',
    colorNamespace: 'donut',
    data,
    formatPercentage,
    formatValue,
    remainderColor,
    remainderLabel,
    segmentColor,
    segmentId,
    segmentLabel,
    segmentValue,
  })
  const positiveSegmentCount = layout.segments.filter((segment) => segment.percentage > 0).length
  let nextAngle = -90

  const segments = layout.segments.map((segment) => {
    const sweep = (segment.percentage / 100) * FULL_CIRCLE
    const startAngle = nextAngle
    const middleAngle = startAngle + sweep / 2
    nextAngle += sweep

    if (segment.percentage <= 0) {
      return {
        ...segment,
        geometry: null,
        path: '',
        shape: 'none',
        tooltipX: center,
        tooltipY: center,
      }
    }

    const tooltipPoint = pointOnCircle(center, radius, middleAngle)
    const requestedHalfCut = positiveSegmentCount === 1 ? 0 : safeSegmentGap / 2 + safeCornerRadius
    const maximumHalfCut = Math.max(
      innerRadius * Math.sin((Math.min(sweep, 180) * Math.PI) / 360) - 0.001,
      0,
    )
    const halfCut = Math.min(requestedHalfCut, maximumHalfCut)
    const outerOffset = angularOffset(outerRadius, halfCut)
    const innerOffset = angularOffset(innerRadius, halfCut)
    const outerStartAngle = startAngle + outerOffset
    const outerEndAngle = startAngle + sweep - outerOffset
    const innerStartAngle = startAngle + innerOffset
    const innerEndAngle = startAngle + sweep - innerOffset

    return {
      ...segment,
      geometry: {
        halfCut,
        innerEndAngle,
        innerStartAngle,
        outerEndAngle,
        outerStartAngle,
      },
      path: annularPath(
        center,
        innerRadius,
        outerRadius,
        outerStartAngle,
        outerEndAngle,
        innerStartAngle,
        innerEndAngle,
      ),
      shape: 'path',
      tooltipX: tooltipPoint.x,
      tooltipY: tooltipPoint.y,
    }
  })

  return {
    ...layout,
    center,
    cornerRadius: safeCornerRadius,
    diameter: safeDiameter,
    innerRadius,
    outerRadius,
    radius,
    segmentGap: safeSegmentGap,
    segments,
    thickness: safeThickness,
  }
}
