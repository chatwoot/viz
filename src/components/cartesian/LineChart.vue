<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

import { createCartesianItemPayload } from './cartesian-layout.js'
import { createLineLayout } from './line-layout.js'

defineOptions({ name: 'LineChart' })

const props = defineProps({
  ariaLabel: {
    type: String,
    default: 'Line chart',
  },
  categoryLabel: {
    type: Function,
    default: (category) => category?.label ?? category,
  },
  data: {
    type: Object,
    required: true,
  },
  formatValue: {
    type: [Function, String],
    default: () => (value) => Number(value).toLocaleString(),
  },
  height: {
    type: Number,
    default: 360,
  },
  onItemClick: {
    type: Function,
    default: undefined,
  },
  pointDescription: {
    type: Function,
    default: (point) => point?.description,
  },
  pointRadius: {
    type: Number,
    default: 5,
  },
  pointValue: {
    type: Function,
    default: (point) => (typeof point === 'number' ? point : (point?.value ?? point?.y)),
  },
  seriesColor: {
    type: [Function, String],
    default: () => (series) => series.color,
  },
  seriesId: {
    type: Function,
    default: (series, index) => series.id ?? index,
  },
  seriesLabel: {
    type: Function,
    default: (series, index) => series.label ?? series.id ?? `Series ${index + 1}`,
  },
  seriesPointBorderColor: {
    type: [Function, String],
    default: () => (series) => series.pointBorderColor,
  },
  seriesPointColor: {
    type: [Function, String],
    default: () => (series) => series.pointColor,
  },
  seriesValueColor: {
    type: [Function, String],
    default: () => (series) => series.valueColor ?? series.labelColor,
  },
  seriesValues: {
    type: Function,
    default: (series) => series.data ?? series.values ?? [],
  },
  showValues: {
    type: Boolean,
    default: true,
  },
  showTooltip: {
    type: Boolean,
    default: true,
  },
  width: {
    type: Number,
    default: 960,
  },
  xInset: {
    type: Number,
    default: undefined,
  },
  yDomain: {
    type: Array,
    default: undefined,
  },
  yStepSize: {
    type: [Number, Function],
    default: undefined,
    validator: (value) => typeof value === 'function' || (Number.isFinite(value) && value > 0),
  },
  yTickCount: {
    type: Number,
    default: 5,
  },
  yTicks: {
    type: Array,
    default: undefined,
  },
})

const chartRoot = useTemplateRef('chart-root')
const measuredWidth = ref(0)
const activePoint = ref(null)
let resizeObserver
let resizeFrame

const chartWidth = computed(() => Math.max(Math.round(measuredWidth.value || props.width), 280))
const layout = computed(() =>
  createLineLayout({
    categoryLabel: props.categoryLabel,
    data: props.data,
    formatValue: props.formatValue,
    height: props.height,
    pointDescription: props.pointDescription,
    pointValue: props.pointValue,
    seriesColor: props.seriesColor,
    seriesId: props.seriesId,
    seriesLabel: props.seriesLabel,
    seriesPointBorderColor: props.seriesPointBorderColor,
    seriesPointColor: props.seriesPointColor,
    seriesValueColor: props.seriesValueColor,
    seriesValues: props.seriesValues,
    width: chartWidth.value,
    xInset: props.xInset,
    yDomain: props.yDomain,
    yStepSize: props.yStepSize,
    yTickCount: props.yTickCount,
    yTicks: props.yTicks,
  }),
)
const description = computed(() => {
  if (layout.value.error) return layout.value.error
  return `${layout.value.series.length} series across ${layout.value.categories.length} categories.`
})
const tooltip = computed(() => {
  if (!props.showTooltip || !activePoint.value) return null

  const anchorSeries = layout.value.series[activePoint.value.seriesIndex]
  const anchorPoint = anchorSeries?.points[activePoint.value.pointIndex]
  if (!anchorPoint) return null

  return {
    category: anchorPoint.category.label,
    horizontalPosition:
      anchorPoint.x < chartWidth.value * 0.25
        ? 'start'
        : anchorPoint.x > chartWidth.value * 0.75
          ? 'end'
          : 'center',
    rows: layout.value.series.flatMap((series) => {
      const point = series.points[activePoint.value.pointIndex]
      if (!point) return []

      return [
        {
          color: series.pointColor,
          description: point.description,
          formattedValue: point.formattedValue,
          id: series.id,
          isActive: series.index === activePoint.value.seriesIndex,
          label: series.label,
        },
      ]
    }),
    showBelow: anchorPoint.y < props.height * 0.3,
    x: activePoint.value.x,
    y: activePoint.value.y,
  }
})

function updateWidth(width) {
  if (Number.isFinite(width) && width > 0) {
    measuredWidth.value = width
    activePoint.value = null
  }
}

function openTooltip(seriesIndex, pointIndex, event) {
  if (!props.showTooltip) return

  const rootBounds = chartRoot.value?.getBoundingClientRect()
  const matrix = event.currentTarget?.getScreenCTM?.()
  const point = layout.value.series[seriesIndex]?.points[pointIndex]
  if (!rootBounds || !point) return

  activePoint.value = {
    pointIndex,
    seriesIndex,
    x: matrix ? matrix.e - rootBounds.left : (point.x / chartWidth.value) * rootBounds.width,
    y: matrix ? matrix.f - rootBounds.top : (point.y / props.height) * rootBounds.height,
  }
}

function closeTooltip() {
  activePoint.value = null
}

function handleItemClick(seriesIndex, pointIndex, event) {
  if (!props.onItemClick) return

  const series = layout.value.series[seriesIndex]
  const point = series?.points[pointIndex]
  if (!series || !point) return

  props.onItemClick(createCartesianItemPayload(series, point, event))
}

function handleItemKeydown(seriesIndex, pointIndex, event) {
  if (!props.onItemClick || !['Enter', ' '].includes(event.key)) return

  event.preventDefault()
  handleItemClick(seriesIndex, pointIndex, event)
}

function scheduleWidthUpdate(width) {
  if (typeof requestAnimationFrame === 'undefined') {
    updateWidth(width)
    return
  }

  if (resizeFrame) cancelAnimationFrame(resizeFrame)
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = undefined
    updateWidth(width)
  })
}

onMounted(() => {
  updateWidth(chartRoot.value?.getBoundingClientRect().width)

  if (typeof ResizeObserver === 'undefined' || !chartRoot.value) return

  resizeObserver = new ResizeObserver((entries) => {
    scheduleWidthUpdate(entries[0]?.contentRect.width)
  })
  resizeObserver.observe(chartRoot.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (resizeFrame) cancelAnimationFrame(resizeFrame)
})
</script>

<template>
  <div ref="chart-root" class="cw-viz-line">
    <svg
      class="cw-viz-line__svg"
      :viewBox="`0 0 ${chartWidth} ${height}`"
      role="img"
      :aria-label="ariaLabel"
      preserveAspectRatio="xMidYMid meet"
    >
      <desc>{{ description }}</desc>

      <text
        v-if="layout.error || !layout.series.length"
        class="cw-viz-line__empty"
        x="50%"
        y="50%"
        text-anchor="middle"
      >
        {{ layout.error || 'No line data to display.' }}
      </text>

      <g v-else>
        <g class="cw-viz-line__axes" data-viz-layer="axes">
          <line
            class="cw-viz-line__axis"
            :x1="layout.plot.left"
            :x2="layout.plot.left"
            :y1="layout.plot.top"
            :y2="layout.plot.bottom"
          />
          <line
            class="cw-viz-line__axis"
            :x1="layout.plot.left"
            :x2="layout.plot.right"
            :y1="layout.plot.bottom"
            :y2="layout.plot.bottom"
          />

          <g
            v-for="tick in layout.yTicks"
            :key="tick.value"
            class="cw-viz-line__y-tick"
            :transform="`translate(0 ${tick.y})`"
          >
            <line
              class="cw-viz-line__tick-mark"
              :x1="layout.plot.left - 9"
              :x2="layout.plot.left"
              y1="0"
              y2="0"
            />
            <text
              class="cw-viz-line__axis-label cw-viz-line__axis-label--y"
              :x="layout.plot.left - 14"
              y="0"
              dominant-baseline="central"
              text-anchor="end"
            >
              {{ tick.formattedValue }}
            </text>
          </g>

          <g
            v-for="category in layout.categories"
            :key="category.index"
            class="cw-viz-line__x-tick"
            :transform="`translate(${category.x} ${layout.plot.bottom})`"
          >
            <line class="cw-viz-line__tick-mark" x1="0" x2="0" y1="0" y2="10" />
            <text
              class="cw-viz-line__axis-label cw-viz-line__axis-label--x"
              x="0"
              y="30"
              text-anchor="middle"
            >
              {{ category.displayLabel }}
            </text>
          </g>
        </g>

        <g class="cw-viz-line__series-layer" data-viz-layer="series">
          <g
            v-for="series in layout.series"
            :key="series.id"
            class="cw-viz-line__series"
            :data-series-id="series.id"
          >
            <path class="cw-viz-line__path" :d="series.path" :stroke="series.color" />

            <g
              v-for="point in series.points.filter(Boolean)"
              :key="point.index"
              class="cw-viz-line__point-group"
              :class="{ 'cw-viz-line__point-group--clickable': onItemClick }"
              :transform="`translate(${point.x} ${point.y})`"
              :data-point-index="point.index"
              :tabindex="showTooltip || onItemClick ? 0 : undefined"
              :role="onItemClick ? 'button' : undefined"
              :aria-label="`${series.label}, ${point.category.label}: ${point.formattedValue}${point.description ? `. ${point.description}` : ''}`"
              @click="handleItemClick(series.index, point.index, $event)"
              @keydown="handleItemKeydown(series.index, point.index, $event)"
              @pointerenter="openTooltip(series.index, point.index, $event)"
              @pointerleave="closeTooltip"
              @focus="openTooltip(series.index, point.index, $event)"
              @blur="closeTooltip"
            >
              <circle
                class="cw-viz-line__point-background"
                cx="0"
                cy="0"
                :r="pointRadius"
                :fill="series.pointBorderColor"
                :stroke="series.pointBorderColor"
                aria-hidden="true"
              />
              <circle
                class="cw-viz-line__point"
                cx="0"
                cy="0"
                :r="pointRadius * 0.8"
                :fill="series.pointColor"
              ></circle>
              <text
                v-if="showValues"
                class="cw-viz-line__value"
                x="0"
                :y="point.labelY - point.y"
                :fill="series.valueColor"
                dominant-baseline="central"
                text-anchor="middle"
              >
                {{ point.formattedValue }}
              </text>
            </g>
          </g>
        </g>
      </g>
    </svg>

    <div
      v-if="tooltip"
      class="cw-viz-line__tooltip"
      :class="[
        `cw-viz-line__tooltip--${tooltip.horizontalPosition}`,
        { 'cw-viz-line__tooltip--below': tooltip.showBelow },
      ]"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      role="tooltip"
    >
      <p class="cw-viz-line__tooltip-title">{{ tooltip.category }}</p>
      <div class="cw-viz-line__tooltip-list">
        <div
          v-for="row in tooltip.rows"
          :key="row.id"
          class="cw-viz-line__tooltip-row"
          :class="{ 'cw-viz-line__tooltip-row--active': row.isActive }"
        >
          <span class="cw-viz-line__tooltip-dot" :style="{ backgroundColor: row.color }" />
          <span class="cw-viz-line__tooltip-label">{{ row.label }}</span>
          <strong class="cw-viz-line__tooltip-value">{{ row.formattedValue }}</strong>
          <span v-if="row.description" class="cw-viz-line__tooltip-description">
            {{ row.description }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cw-viz-line {
  position: relative;
  width: 100%;
  min-width: 0;
  color: var(--cw-viz-line-label-color, #60646c);
  font-family: inherit;
}

.cw-viz-line__tooltip {
  position: absolute;
  z-index: 1;
  width: max-content;
  min-width: 10rem;
  max-width: min(16rem, calc(100% - 1rem));
  padding: 0.75rem;
  border: 1px solid var(--cw-viz-line-tooltip-border-color, #e0e1e6);
  border-radius: 6px;
  color: var(--cw-viz-line-tooltip-color, #1c2024);
  background: var(--cw-viz-line-tooltip-background, #ffffff);
  box-shadow: var(--cw-viz-line-tooltip-shadow, 0 4px 16px rgb(0 0 0 / 10%));
  font-size: var(--cw-viz-line-tooltip-font-size, 12px);
  line-height: 1.35;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 12px));
}

.cw-viz-line__tooltip--start {
  transform: translate(0, calc(-100% - 12px));
}

.cw-viz-line__tooltip--end {
  transform: translate(-100%, calc(-100% - 12px));
}

.cw-viz-line__tooltip--below {
  transform: translate(-50%, 12px);
}

.cw-viz-line__tooltip--below.cw-viz-line__tooltip--start {
  transform: translate(0, 12px);
}

.cw-viz-line__tooltip--below.cw-viz-line__tooltip--end {
  transform: translate(-100%, 12px);
}

.cw-viz-line__tooltip-title {
  margin: 0 0 0.5rem;
  color: var(--cw-viz-line-tooltip-label-color, #60646c);
  font-weight: 500;
}

.cw-viz-line__tooltip-list {
  display: grid;
  gap: 0.35rem;
}

.cw-viz-line__tooltip-row {
  display: grid;
  align-items: center;
  column-gap: 0.45rem;
  row-gap: 0.1rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.cw-viz-line__tooltip-row--active {
  color: var(--cw-viz-line-tooltip-active-color, #1c2024);
}

.cw-viz-line__tooltip-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.cw-viz-line__tooltip-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cw-viz-line__tooltip-value {
  font-variant-numeric: tabular-nums;
}

.cw-viz-line__tooltip-description {
  grid-column: 2 / -1;
  color: var(--cw-viz-line-tooltip-label-color, #60646c);
  font-size: var(--cw-viz-line-tooltip-description-font-size, 11px);
  font-weight: 400;
  overflow-wrap: anywhere;
}

.cw-viz-line__svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.cw-viz-line__axis,
.cw-viz-line__tick-mark {
  stroke: var(--cw-viz-line-axis-color, #d9d9e0);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.cw-viz-line__axis-label,
.cw-viz-line__empty {
  fill: currentcolor;
  font-size: var(--cw-viz-line-axis-font-size, 12px);
}

.cw-viz-line__axis-label--x {
  font-weight: 500;
}

.cw-viz-line__path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: var(--cw-viz-line-width, 2px);
  vector-effect: non-scaling-stroke;
}

.cw-viz-line__point-background {
  stroke-width: var(--cw-viz-line-point-border-width, 6px);
}

.cw-viz-line__point,
.cw-viz-line__point-background {
  transform-box: fill-box;
  transform-origin: center;
  vector-effect: non-scaling-stroke;
  transition: transform 120ms ease;
}

.cw-viz-line__point-group--clickable {
  cursor: pointer;
}

.cw-viz-line__point-group:focus {
  outline: none;
}

.cw-viz-line__point-group:hover .cw-viz-line__point,
.cw-viz-line__point-group:hover .cw-viz-line__point-background,
.cw-viz-line__point-group:focus .cw-viz-line__point,
.cw-viz-line__point-group:focus .cw-viz-line__point-background {
  transform: scale(1.2);
}

.cw-viz-line__point-group:focus-visible .cw-viz-line__point-background {
  stroke: var(--cw-viz-line-focus-color, rgb(62 99 221 / 45%));
  stroke-width: 1px;
}

.cw-viz-line__value {
  font-size: var(--cw-viz-line-value-font-size, 12px);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .cw-viz-line__point {
    transition: none;
  }

  .cw-viz-line__point-background {
    transition: none;
  }
}
</style>
