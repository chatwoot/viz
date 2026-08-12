<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

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
let resizeObserver
let resizeFrame

const chartWidth = computed(() => Math.max(Math.round(measuredWidth.value || props.width), 280))
const layout = computed(() =>
  createLineLayout({
    categoryLabel: props.categoryLabel,
    data: props.data,
    formatValue: props.formatValue,
    height: props.height,
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
    yTickCount: props.yTickCount,
    yTicks: props.yTicks,
  }),
)
const description = computed(() => {
  if (layout.value.error) return layout.value.error
  return `${layout.value.series.length} series across ${layout.value.categories.length} categories.`
})

function updateWidth(width) {
  if (Number.isFinite(width) && width > 0) measuredWidth.value = width
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
      <title>{{ ariaLabel }}</title>
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
              <title>{{ category.label }}</title>
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
            <path class="cw-viz-line__path" :d="series.path" :stroke="series.color">
              <title>{{ series.label }}</title>
            </path>

            <g
              v-for="point in series.points.filter(Boolean)"
              :key="point.index"
              class="cw-viz-line__point-group"
              :transform="`translate(${point.x} ${point.y})`"
              :data-point-index="point.index"
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
                :r="pointRadius"
                :fill="series.pointColor"
              >
                <title>
                  {{ series.label }}, {{ point.category.label }}: {{ point.formattedValue }}
                </title>
              </circle>
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
  </div>
</template>

<style scoped>
.cw-viz-line {
  width: 100%;
  min-width: 0;
  color: var(--cw-viz-line-label-color, #60646c);
  font-family: inherit;
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

.cw-viz-line__point-group:hover .cw-viz-line__point,
.cw-viz-line__point-group:hover .cw-viz-line__point-background {
  transform: scale(1.2);
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
