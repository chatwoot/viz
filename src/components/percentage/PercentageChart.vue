<script setup>
import { computed, ref, useTemplateRef, watch } from 'vue'

import { createPercentageLayout } from './percentage-layout.js'

defineOptions({ name: 'PercentageChart' })

const props = defineProps({
  ariaLabel: {
    type: String,
    default: 'Percentage chart',
  },
  barGap: {
    type: Number,
    default: 2,
  },
  barHeight: {
    type: Number,
    default: 24,
  },
  barRadius: {
    type: Number,
    default: 4,
  },
  data: {
    type: Object,
    required: true,
  },
  formatPercentage: {
    type: [Function, String],
    default: '%',
  },
  formatValue: {
    type: [Function, String],
    default: () => (value) => Number(value).toLocaleString(),
  },
  onItemClick: {
    type: Function,
    default: undefined,
  },
  remainderColor: {
    type: String,
    default: 'var(--cw-viz-percentage-remainder-color, #f0f0f3)',
  },
  remainderLabel: {
    type: String,
    default: 'Unused',
  },
  segmentColor: {
    type: [Function, String],
    default: () => (segment) => segment?.color,
  },
  segmentId: {
    type: Function,
    default: (segment, index) => segment?.id ?? index,
  },
  segmentLabel: {
    type: Function,
    default: (segment, index) => segment?.label ?? segment?.id ?? `Segment ${index + 1}`,
  },
  segmentValue: {
    type: Function,
    default: (segment) =>
      typeof segment === 'number' ? segment : (segment?.value ?? segment?.count),
  },
  showLegend: {
    type: Boolean,
    default: true,
  },
  showTooltip: {
    type: Boolean,
    default: true,
  },
})

const chartRoot = useTemplateRef('chart-root')
const activeTooltip = ref(null)
const layout = computed(() =>
  createPercentageLayout({
    data: props.data,
    formatPercentage: props.formatPercentage,
    formatValue: props.formatValue,
    remainderColor: props.remainderColor,
    remainderLabel: props.remainderLabel,
    segmentColor: props.segmentColor,
    segmentId: props.segmentId,
    segmentLabel: props.segmentLabel,
    segmentValue: props.segmentValue,
  }),
)
const rootStyle = computed(() => ({
  '--cw-viz-percentage-bar-gap': `${Math.max(props.barGap, 0)}px`,
  '--cw-viz-percentage-bar-height': `${Math.max(props.barHeight, 1)}px`,
  '--cw-viz-percentage-bar-radius': `${Math.max(props.barRadius, 0)}px`,
}))
const barSegments = computed(() =>
  layout.value.segments.filter((segment) => segment.percentage > 0),
)
const tooltip = computed(() => (props.showTooltip ? activeTooltip.value : null))
const description = computed(() => {
  if (layout.value.error) return layout.value.error

  return layout.value.segments
    .map((segment) => `${segment.label}: ${segment.tooltipValue}`)
    .join(', ')
})

function openTooltip(segment, event) {
  if (!props.showTooltip) return

  const rootBounds = chartRoot.value?.getBoundingClientRect()
  const segmentBounds = event.currentTarget?.getBoundingClientRect()
  if (!rootBounds || !segmentBounds) return

  const x = segmentBounds.left - rootBounds.left + segmentBounds.width / 2
  activeTooltip.value = {
    horizontalPosition:
      x < rootBounds.width * 0.25 ? 'start' : x > rootBounds.width * 0.75 ? 'end' : 'center',
    label: segment.label,
    segmentIndex: segment.index,
    value: segment.tooltipValue,
    x,
    y: segmentBounds.top - rootBounds.top,
  }
}

function closeTooltip() {
  activeTooltip.value = null
}

watch(layout, closeTooltip)

function selectSegment(segment, event) {
  if (!props.onItemClick) return

  props.onItemClick({
    event,
    formattedPercentage: segment.formattedPercentage,
    formattedValue: segment.formattedValue,
    id: segment.id,
    index: segment.index,
    isRemainder: segment.isRemainder,
    item: segment.datum,
    itemType: segment.isRemainder ? 'remainder' : 'segment',
    label: segment.label,
    percentage: segment.percentage,
    value: segment.value,
  })
}
</script>

<template>
  <div
    ref="chart-root"
    class="cw-viz-percentage"
    :style="rootStyle"
    role="group"
    :aria-label="ariaLabel"
  >
    <p class="cw-viz-percentage__description">{{ description }}</p>

    <header v-if="layout.title || layout.summary" class="cw-viz-percentage__header">
      <p v-if="layout.title" class="cw-viz-percentage__title">{{ layout.title }}</p>
      <p v-if="layout.summary" class="cw-viz-percentage__summary">{{ layout.summary }}</p>
    </header>

    <p v-if="layout.error" class="cw-viz-percentage__empty">{{ layout.error }}</p>

    <template v-else>
      <div class="cw-viz-percentage__bar">
        <component
          :is="showTooltip || onItemClick ? 'button' : 'span'"
          v-for="segment in barSegments"
          :key="segment.key"
          :type="showTooltip || onItemClick ? 'button' : undefined"
          class="cw-viz-percentage__segment"
          :class="{
            'cw-viz-percentage__segment--remainder': segment.isRemainder,
          }"
          :style="{
            '--cw-viz-percentage-segment-color': segment.color,
            '--cw-viz-percentage-segment-size': segment.percentage,
          }"
          :aria-label="`${segment.label}: ${segment.tooltipValue}`"
          @pointerenter="openTooltip(segment, $event)"
          @pointerleave="closeTooltip"
          @focus="openTooltip(segment, $event)"
          @blur="closeTooltip"
          @keydown.esc="closeTooltip"
          @click="selectSegment(segment, $event)"
        />
      </div>

      <div
        v-if="tooltip"
        class="cw-viz-percentage__tooltip"
        :class="`cw-viz-percentage__tooltip--${tooltip.horizontalPosition}`"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
        role="tooltip"
      >
        <span>{{ tooltip.label }}</span>
        <strong>{{ tooltip.value }}</strong>
      </div>

      <ul v-if="showLegend" class="cw-viz-percentage__legend">
        <li
          v-for="segment in layout.segments"
          :key="segment.key"
          :class="{
            'cw-viz-percentage__legend-item--remainder': segment.isRemainder,
          }"
        >
          <span
            class="cw-viz-percentage__swatch"
            :class="{
              'cw-viz-percentage__swatch--remainder': segment.isRemainder,
            }"
            :style="{ '--cw-viz-percentage-segment-color': segment.color }"
            aria-hidden="true"
          />
          <span>{{ segment.label }}</span>
          <strong>{{ segment.legendValue }}</strong>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.cw-viz-percentage {
  position: relative;
  container-type: inline-size;
  width: 100%;
  min-width: 0;
  color: var(--cw-viz-percentage-label-color, #60646c);
  font-family: inherit;
}

.cw-viz-percentage__description {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.cw-viz-percentage__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.875rem;
}

.cw-viz-percentage__title,
.cw-viz-percentage__summary {
  margin: 0;
  line-height: 1.3;
}

.cw-viz-percentage__title {
  color: var(--cw-viz-percentage-title-color, #1c2024);
  font-size: var(--cw-viz-percentage-title-font-size, 14px);
  font-weight: 600;
}

.cw-viz-percentage__summary {
  color: var(--cw-viz-percentage-summary-color, #60646c);
  font-size: var(--cw-viz-percentage-summary-font-size, 12px);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.cw-viz-percentage__bar {
  display: flex;
  width: 100%;
  height: var(--cw-viz-percentage-bar-height);
  gap: var(--cw-viz-percentage-bar-gap);
}

.cw-viz-percentage__segment {
  position: relative;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex: var(--cw-viz-percentage-segment-size) 1 0;
  padding: 0;
  border: 0;
  border-radius: var(--cw-viz-percentage-bar-radius);
  appearance: none;
  background-color: var(--cw-viz-percentage-segment-color);
  box-shadow: inset 0 0 0 1px rgb(28 32 36 / 6%);
  cursor: pointer;
  transform-origin: center;
  transition:
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 180ms ease,
    filter 180ms ease;
}

span.cw-viz-percentage__segment {
  cursor: default;
}

.cw-viz-percentage__segment:hover,
.cw-viz-percentage__segment:focus-visible {
  z-index: 1;
  border-color: transparent;
  outline: none;
  background-color: var(--cw-viz-percentage-segment-color);
  filter: saturate(1.06);
  box-shadow:
    inset 0 0 0 1px rgb(28 32 36 / 6%),
    0 4px 10px rgb(28 32 36 / 16%);
  transform: scaleY(1.12);
}

.cw-viz-percentage__segment:focus-visible {
  outline: 2px solid var(--cw-viz-percentage-focus-color, #3e63dd);
  outline-offset: 2px;
}

.cw-viz-percentage__segment--remainder {
  border: 1px solid var(--cw-viz-percentage-remainder-border-color, #e0e1e6);
  box-shadow: none;
}

.cw-viz-percentage__segment--remainder:hover,
.cw-viz-percentage__segment--remainder:focus-visible {
  border-color: var(--cw-viz-percentage-remainder-border-color, #e0e1e6);
}

.cw-viz-percentage__tooltip {
  position: absolute;
  z-index: 3;
  display: flex;
  width: max-content;
  max-width: min(18rem, calc(100% - 1rem));
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--cw-viz-percentage-tooltip-border-color, #e0e1e6);
  border-radius: 0.375rem;
  color: var(--cw-viz-percentage-tooltip-label-color, #60646c);
  background: var(--cw-viz-percentage-tooltip-background, #ffffff);
  box-shadow: var(--cw-viz-percentage-tooltip-shadow, 0 4px 16px rgb(0 0 0 / 10%));
  font-size: var(--cw-viz-percentage-tooltip-font-size, 12px);
  line-height: 1.3;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 0.5rem));
}

.cw-viz-percentage__tooltip--start {
  transform: translate(0, calc(-100% - 0.5rem));
}

.cw-viz-percentage__tooltip--end {
  transform: translate(-100%, calc(-100% - 0.5rem));
}

.cw-viz-percentage__tooltip strong {
  color: var(--cw-viz-percentage-tooltip-value-color, #1c2024);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cw-viz-percentage__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem 1.25rem;
  margin: 0.75rem 0 0;
  padding: 0;
  font-size: var(--cw-viz-percentage-legend-font-size, 12px);
  list-style: none;
}

.cw-viz-percentage__legend li {
  display: grid;
  align-items: center;
  gap: 0.375rem;
  grid-template-columns: auto auto auto;
  white-space: nowrap;
}

.cw-viz-percentage__legend strong {
  color: var(--cw-viz-percentage-legend-value-color, #1c2024);
  font-size: inherit;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.cw-viz-percentage__legend-item--remainder,
.cw-viz-percentage__legend-item--remainder strong {
  color: var(--cw-viz-percentage-remainder-label-color, #8b8d98);
}

.cw-viz-percentage__swatch {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 999px;
  background: var(--cw-viz-percentage-segment-color);
  box-shadow: inset 0 0 0 1px rgb(28 32 36 / 8%);
}

.cw-viz-percentage__swatch--remainder {
  border: 1px solid var(--cw-viz-percentage-remainder-swatch-border-color, #b9bbc6);
  box-shadow: none;
}

.cw-viz-percentage__empty {
  margin: 0;
  padding: 3rem 1rem;
  color: var(--cw-viz-percentage-label-color, #60646c);
  font-size: 12px;
  text-align: center;
}

@container (max-width: 440px) {
  .cw-viz-percentage__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.25rem;
  }

  .cw-viz-percentage__summary {
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cw-viz-percentage__segment {
    transition: none;
  }
}
</style>
