<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

import { createBarLayout } from './bar-layout.js'
import { createCartesianItemPayload } from './cartesian-layout.js'

defineOptions({ name: 'BarChart' })

const props = defineProps({
  ariaLabel: {
    type: String,
    default: 'Bar chart',
  },
  barGap: {
    type: Number,
    default: 6,
  },
  barRadius: {
    type: Number,
    default: 6,
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
  maxBarWidth: {
    type: Number,
    default: 48,
  },
  onItemClick: {
    type: Function,
    default: undefined,
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
  seriesValueColor: {
    type: [Function, String],
    default: () => (series) => series.valueColor ?? series.labelColor,
  },
  seriesValues: {
    type: Function,
    default: (series) => series.data ?? series.values ?? [],
  },
  showTooltip: {
    type: Boolean,
    default: true,
  },
  showValues: {
    type: Boolean,
    default: false,
  },
  stacked: {
    type: Boolean,
    default: false,
  },
  timeseries: {
    type: Boolean,
    default: false,
  },
  width: {
    type: Number,
    default: 960,
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
const activeBar = ref(null)
let resizeFrame
let resizeObserver

const chartWidth = computed(() => Math.max(Math.round(measuredWidth.value || props.width), 280))
const layout = computed(() =>
  createBarLayout({
    barGap: props.barGap,
    barRadius: props.barRadius,
    categoryLabel: props.categoryLabel,
    data: props.data,
    formatValue: props.formatValue,
    height: props.height,
    maxBarWidth: props.maxBarWidth,
    pointValue: props.pointValue,
    seriesColor: props.seriesColor,
    seriesId: props.seriesId,
    seriesLabel: props.seriesLabel,
    seriesValueColor: props.seriesValueColor,
    seriesValues: props.seriesValues,
    stacked: props.stacked,
    timeseries: props.timeseries,
    width: chartWidth.value,
    yDomain: props.yDomain,
    yStepSize: props.yStepSize,
    yTickCount: props.yTickCount,
    yTicks: props.yTicks,
  }),
)
const description = computed(() => {
  if (layout.value.error) return layout.value.error
  const arrangement = props.stacked ? 'stacked' : 'grouped'
  return `${layout.value.series.length} ${arrangement} series across ${layout.value.categories.length} categories.`
})
const tooltip = computed(() => {
  if (!props.showTooltip || !activeBar.value) return null

  const anchorSeries = layout.value.series[activeBar.value.seriesIndex]
  const anchorPoint = anchorSeries?.points[activeBar.value.pointIndex]
  if (!anchorPoint) return null

  return {
    category: anchorPoint.category.label,
    horizontalPosition:
      anchorPoint.centerX < chartWidth.value * 0.25
        ? 'start'
        : anchorPoint.centerX > chartWidth.value * 0.75
          ? 'end'
          : 'center',
    rows: layout.value.series.flatMap((series) => {
      const point = series.points[activeBar.value.pointIndex]
      if (!point) return []

      return [
        {
          color: series.color,
          formattedValue: point.formattedValue,
          id: series.id,
          isActive: series.index === activeBar.value.seriesIndex,
          label: series.label,
        },
      ]
    }),
    showBelow: anchorPoint.anchorY < props.height * 0.3,
    x: activeBar.value.x,
    y: activeBar.value.y,
  }
})

function updateWidth(width) {
  if (Number.isFinite(width) && width > 0) {
    measuredWidth.value = width
    activeBar.value = null
  }
}

function openTooltip(seriesIndex, pointIndex, event) {
  if (!props.showTooltip) return

  const rootBounds = chartRoot.value?.getBoundingClientRect()
  const matrix = event.currentTarget?.getScreenCTM?.()
  const point = layout.value.series[seriesIndex]?.points[pointIndex]
  if (!rootBounds || !point) return

  activeBar.value = {
    pointIndex,
    seriesIndex,
    x: matrix ? matrix.e - rootBounds.left : (point.centerX / chartWidth.value) * rootBounds.width,
    y: matrix ? matrix.f - rootBounds.top : (point.anchorY / props.height) * rootBounds.height,
  }
}

function closeTooltip() {
  activeBar.value = null
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
  <div ref="chart-root" class="cw-viz-bar">
    <svg
      class="cw-viz-bar__svg"
      :viewBox="`0 0 ${chartWidth} ${height}`"
      role="img"
      :aria-label="ariaLabel"
      preserveAspectRatio="xMidYMid meet"
    >
      <desc>{{ description }}</desc>

      <text
        v-if="layout.error || !layout.series.length"
        class="cw-viz-bar__empty"
        x="50%"
        y="50%"
        text-anchor="middle"
      >
        {{ layout.error || 'No bar data to display.' }}
      </text>

      <g v-else>
        <g class="cw-viz-bar__axes" data-viz-layer="axes">
          <line
            class="cw-viz-bar__axis"
            :x1="layout.plot.left"
            :x2="layout.plot.left"
            :y1="layout.plot.top"
            :y2="layout.plot.bottom"
          />
          <line
            class="cw-viz-bar__axis"
            :x1="layout.plot.left"
            :x2="layout.plot.right"
            :y1="layout.plot.bottom"
            :y2="layout.plot.bottom"
          />
          <line
            v-if="Math.abs(layout.zeroY - layout.plot.bottom) > 0.5"
            class="cw-viz-bar__zero-line"
            :x1="layout.plot.left"
            :x2="layout.plot.right"
            :y1="layout.zeroY"
            :y2="layout.zeroY"
          />

          <g
            v-for="tick in layout.yTicks"
            :key="tick.value"
            class="cw-viz-bar__y-tick"
            :transform="`translate(0 ${tick.y})`"
          >
            <line
              class="cw-viz-bar__tick-mark"
              :x1="layout.plot.left - 9"
              :x2="layout.plot.left"
              y1="0"
              y2="0"
            />
            <text
              class="cw-viz-bar__axis-label cw-viz-bar__axis-label--y"
              :x="layout.plot.left - 14"
              y="0"
              dominant-baseline="central"
              text-anchor="end"
            >
              {{ tick.formattedValue }}
            </text>
          </g>

          <g
            v-for="category in layout.categories.filter((category) => category.showLabel)"
            :key="category.index"
            class="cw-viz-bar__x-tick"
            :transform="`translate(${category.x} ${layout.plot.bottom})`"
          >
            <line class="cw-viz-bar__tick-mark" x1="0" x2="0" y1="0" y2="10" />
            <text
              class="cw-viz-bar__axis-label cw-viz-bar__axis-label--x"
              x="0"
              y="30"
              text-anchor="middle"
            >
              {{ category.displayLabel }}
            </text>
          </g>
        </g>

        <g class="cw-viz-bar__series-layer" data-viz-layer="series">
          <g
            v-for="series in layout.series"
            :key="series.id"
            class="cw-viz-bar__series"
            :data-series-id="series.id"
          >
            <g
              v-for="point in series.points.filter(Boolean)"
              :key="point.index"
              class="cw-viz-bar__bar-group"
              :class="{ 'cw-viz-bar__bar-group--clickable': onItemClick }"
              :transform="`translate(${point.centerX} ${point.anchorY})`"
              :data-point-index="point.index"
              :tabindex="showTooltip || onItemClick ? 0 : undefined"
              :role="onItemClick ? 'button' : undefined"
              :aria-label="`${series.label}, ${point.category.label}: ${point.formattedValue}`"
              @click="handleItemClick(series.index, point.index, $event)"
              @keydown="handleItemKeydown(series.index, point.index, $event)"
              @pointerenter="openTooltip(series.index, point.index, $event)"
              @pointerleave="closeTooltip"
              @focus="openTooltip(series.index, point.index, $event)"
              @blur="closeTooltip"
            >
              <path class="cw-viz-bar__bar" :d="point.path" :fill="series.color" />
              <text
                v-if="showValues && point.height > 0"
                class="cw-viz-bar__value"
                :class="{ 'cw-viz-bar__value--inside': point.labelInside }"
                x="0"
                :y="point.labelY"
                :fill="point.labelInside ? undefined : series.valueColor"
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
      class="cw-viz-bar__tooltip"
      :class="[
        `cw-viz-bar__tooltip--${tooltip.horizontalPosition}`,
        { 'cw-viz-bar__tooltip--below': tooltip.showBelow },
      ]"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      role="tooltip"
    >
      <p class="cw-viz-bar__tooltip-title">{{ tooltip.category }}</p>
      <div class="cw-viz-bar__tooltip-list">
        <div
          v-for="row in tooltip.rows"
          :key="row.id"
          class="cw-viz-bar__tooltip-row"
          :class="{ 'cw-viz-bar__tooltip-row--active': row.isActive }"
        >
          <span class="cw-viz-bar__tooltip-swatch" :style="{ backgroundColor: row.color }" />
          <span class="cw-viz-bar__tooltip-label">{{ row.label }}</span>
          <strong class="cw-viz-bar__tooltip-value">{{ row.formattedValue }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cw-viz-bar {
  position: relative;
  width: 100%;
  min-width: 0;
  color: var(--cw-viz-bar-label-color, #60646c);
  font-family: inherit;
}

.cw-viz-bar__svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.cw-viz-bar__axis,
.cw-viz-bar__tick-mark,
.cw-viz-bar__zero-line {
  stroke: var(--cw-viz-bar-axis-color, #d9d9e0);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.cw-viz-bar__zero-line {
  stroke: var(--cw-viz-bar-zero-line-color, #b9bbc6);
}

.cw-viz-bar__axis-label,
.cw-viz-bar__empty {
  fill: currentcolor;
  font-size: var(--cw-viz-bar-axis-font-size, 12px);
}

.cw-viz-bar__axis-label--x {
  font-weight: 500;
}

.cw-viz-bar__bar {
  transition: opacity 120ms ease;
}

.cw-viz-bar__bar-group--clickable {
  cursor: pointer;
}

.cw-viz-bar__bar-group:hover .cw-viz-bar__bar,
.cw-viz-bar__bar-group:focus .cw-viz-bar__bar {
  opacity: 0.82;
}

.cw-viz-bar__value {
  font-size: var(--cw-viz-bar-value-font-size, 12px);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.cw-viz-bar__value--inside {
  fill: var(--cw-viz-bar-value-inside-color, #ffffff);
}

.cw-viz-bar__tooltip {
  position: absolute;
  z-index: 1;
  min-width: 10rem;
  max-width: min(16rem, calc(100% - 1rem));
  padding: 0.75rem;
  border: 1px solid var(--cw-viz-bar-tooltip-border-color, #e0e1e6);
  border-radius: 6px;
  color: var(--cw-viz-bar-tooltip-color, #1c2024);
  background: var(--cw-viz-bar-tooltip-background, #ffffff);
  box-shadow: var(--cw-viz-bar-tooltip-shadow, 0 4px 16px rgb(0 0 0 / 10%));
  font-size: var(--cw-viz-bar-tooltip-font-size, 12px);
  line-height: 1.35;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 12px));
}

.cw-viz-bar__tooltip--start {
  transform: translate(0, calc(-100% - 12px));
}

.cw-viz-bar__tooltip--end {
  transform: translate(-100%, calc(-100% - 12px));
}

.cw-viz-bar__tooltip--below {
  transform: translate(-50%, 12px);
}

.cw-viz-bar__tooltip--below.cw-viz-bar__tooltip--start {
  transform: translate(0, 12px);
}

.cw-viz-bar__tooltip--below.cw-viz-bar__tooltip--end {
  transform: translate(-100%, 12px);
}

.cw-viz-bar__tooltip-title {
  margin: 0 0 0.5rem;
  color: var(--cw-viz-bar-tooltip-label-color, #60646c);
  font-weight: 500;
}

.cw-viz-bar__tooltip-list {
  display: grid;
  gap: 0.35rem;
}

.cw-viz-bar__tooltip-row {
  display: grid;
  align-items: center;
  gap: 0.45rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.cw-viz-bar__tooltip-row--active {
  color: var(--cw-viz-bar-tooltip-active-color, #1c2024);
}

.cw-viz-bar__tooltip-swatch {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 2px;
}

.cw-viz-bar__tooltip-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cw-viz-bar__tooltip-value {
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .cw-viz-bar__bar {
    transition: none;
  }
}
</style>
