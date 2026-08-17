<script setup>
import { computed, ref, useTemplateRef, watch } from 'vue'

import { createDonutLayout } from './donut-layout.js'

defineOptions({ name: 'DonutChart' })

const props = defineProps({
  ariaLabel: {
    type: String,
    default: 'Donut chart',
  },
  cornerRadius: {
    type: Number,
    default: 2,
  },
  data: {
    type: Object,
    required: true,
  },
  diameter: {
    type: Number,
    default: 200,
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
    default: 'var(--cw-viz-donut-remainder-color, #f0f0f3)',
  },
  remainderLabel: {
    type: String,
    default: 'Unused',
  },
  segmentColor: {
    type: [Function, String],
    default: () => (segment) => segment?.color,
  },
  segmentGap: {
    type: Number,
    default: 3,
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
  thickness: {
    type: Number,
    default: 24,
  },
})

const chartRoot = useTemplateRef('chart-root')
const donutSvg = useTemplateRef('donut-svg')
const activeTooltip = ref(null)
const layout = computed(() =>
  createDonutLayout({
    cornerRadius: props.cornerRadius,
    data: props.data,
    diameter: props.diameter,
    formatPercentage: props.formatPercentage,
    formatValue: props.formatValue,
    remainderColor: props.remainderColor,
    remainderLabel: props.remainderLabel,
    segmentColor: props.segmentColor,
    segmentGap: props.segmentGap,
    segmentId: props.segmentId,
    segmentLabel: props.segmentLabel,
    segmentValue: props.segmentValue,
    thickness: props.thickness,
  }),
)
const rootStyle = computed(() => ({
  '--cw-viz-donut-corner-stroke-width': `${layout.value.cornerRadius * 2}px`,
  '--cw-viz-donut-diameter': `${layout.value.diameter}px`,
  '--cw-viz-donut-focus-stroke-width': `${layout.value.cornerRadius * 2 + 4}px`,
}))
const visualSegments = computed(() =>
  layout.value.segments.filter((segment) => segment.shape !== 'none'),
)
const tooltip = computed(() => (props.showTooltip ? activeTooltip.value : null))
const description = computed(() => {
  if (layout.value.error) return layout.value.error

  return layout.value.segments
    .map(
      (segment) =>
        `${segment.label}: ${segment.tooltipValue}${segment.description ? `. ${segment.description}` : ''}`,
    )
    .join(', ')
})

function openTooltip(segment) {
  if (!props.showTooltip) return

  const rootBounds = chartRoot.value?.getBoundingClientRect()
  const svgBounds = donutSvg.value?.getBoundingClientRect()
  if (!rootBounds || !svgBounds) return

  const x =
    svgBounds.left - rootBounds.left + (segment.tooltipX / layout.value.diameter) * svgBounds.width
  const y =
    svgBounds.top - rootBounds.top + (segment.tooltipY / layout.value.diameter) * svgBounds.height

  activeTooltip.value = {
    horizontalPosition:
      x < rootBounds.width * 0.25 ? 'start' : x > rootBounds.width * 0.75 ? 'end' : 'center',
    description: segment.description,
    label: segment.label,
    segmentIndex: segment.index,
    value: segment.tooltipValue,
    x,
    y,
  }
}

function closeTooltip() {
  activeTooltip.value = null
}

watch(layout, closeTooltip)

function selectSegment(segment, event) {
  if (!props.onItemClick) return

  props.onItemClick({
    description: segment.description,
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
    class="cw-viz-donut"
    :style="rootStyle"
    role="group"
    :aria-label="ariaLabel"
  >
    <p class="cw-viz-donut__description">{{ description }}</p>

    <p v-if="layout.error" class="cw-viz-donut__empty">{{ layout.error }}</p>

    <template v-else>
      <div class="cw-viz-donut__visual">
        <svg
          ref="donut-svg"
          class="cw-viz-donut__svg"
          :viewBox="`0 0 ${layout.diameter} ${layout.diameter}`"
        >
          <g
            v-for="segment in visualSegments"
            :key="segment.key"
            class="cw-viz-donut__segment-group"
            :class="{
              'cw-viz-donut__segment-group--interactive': showTooltip || onItemClick,
              'cw-viz-donut__segment-group--remainder': segment.isRemainder,
            }"
            :data-segment-id="segment.id"
            :role="showTooltip || onItemClick ? 'button' : undefined"
            :tabindex="showTooltip || onItemClick ? 0 : undefined"
            :aria-label="`${segment.label}: ${segment.tooltipValue}${segment.description ? `. ${segment.description}` : ''}`"
            @pointerenter="openTooltip(segment)"
            @pointerleave="closeTooltip"
            @focus="openTooltip(segment)"
            @blur="closeTooltip"
            @keydown.esc="closeTooltip"
            @keydown.enter.prevent="selectSegment(segment, $event)"
            @keydown.space.prevent="selectSegment(segment, $event)"
            @click="selectSegment(segment, $event)"
          >
            <path class="cw-viz-donut__focus-ring" :d="segment.path" fill="none" />
            <path
              class="cw-viz-donut__segment"
              :d="segment.path"
              :fill="segment.color"
              :stroke="segment.color"
            />
          </g>
        </svg>

        <div v-if="$slots.center" class="cw-viz-donut__center">
          <slot
            name="center"
            :has-explicit-total="layout.hasExplicitTotal"
            :remainder="layout.remainder"
            :total="layout.total"
            :used="layout.used"
          />
        </div>
      </div>

      <div
        v-if="tooltip"
        class="cw-viz-donut__tooltip"
        :class="`cw-viz-donut__tooltip--${tooltip.horizontalPosition}`"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
        role="tooltip"
      >
        <div class="cw-viz-donut__tooltip-main">
          <span>{{ tooltip.label }}</span>
          <strong>{{ tooltip.value }}</strong>
        </div>
        <span v-if="tooltip.description" class="cw-viz-donut__tooltip-description">
          {{ tooltip.description }}
        </span>
      </div>

      <ul v-if="showLegend" class="cw-viz-donut__legend">
        <li
          v-for="segment in layout.segments"
          :key="segment.key"
          :class="{
            'cw-viz-donut__legend-item--remainder': segment.isRemainder,
          }"
        >
          <slot
            name="legend-item"
            :color="segment.color"
            :description="segment.description"
            :formatted-percentage="segment.formattedPercentage"
            :formatted-value="segment.formattedValue"
            :id="segment.id"
            :index="segment.index"
            :is-remainder="segment.isRemainder"
            :item="segment.datum"
            :label="segment.label"
            :percentage="segment.percentage"
            :value="segment.value"
          >
            <span
              class="cw-viz-donut__swatch"
              :class="{
                'cw-viz-donut__swatch--remainder': segment.isRemainder,
              }"
              :style="{ '--cw-viz-donut-segment-color': segment.color }"
              aria-hidden="true"
            />
            <span>{{ segment.label }}</span>
            <strong>{{ segment.formattedPercentage }}</strong>
          </slot>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.cw-viz-donut {
  position: relative;
  width: 100%;
  min-width: 0;
  color: var(--cw-viz-donut-label-color, #60646c);
  font-family: inherit;
}

.cw-viz-donut__description {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.cw-viz-donut__visual {
  position: relative;
  width: min(100%, var(--cw-viz-donut-diameter));
  margin-inline: auto;
  aspect-ratio: 1;
}

.cw-viz-donut__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.cw-viz-donut__segment-group {
  outline: none;
}

.cw-viz-donut__segment-group--interactive {
  cursor: pointer;
}

.cw-viz-donut__segment {
  stroke-width: var(--cw-viz-donut-corner-stroke-width);
  stroke-linejoin: round;
  transform-box: view-box;
  transform-origin: center;
  transition:
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    filter 180ms ease;
}

.cw-viz-donut__focus-ring {
  stroke: var(--cw-viz-donut-focus-color, #3e63dd);
  stroke-width: var(--cw-viz-donut-focus-stroke-width);
  stroke-linejoin: round;
  opacity: 0;
  transition: opacity 120ms ease;
}

.cw-viz-donut__segment-group:hover .cw-viz-donut__segment,
.cw-viz-donut__segment-group:focus-visible .cw-viz-donut__segment {
  filter: saturate(1.06) drop-shadow(0 3px 4px rgb(28 32 36 / 18%));
  transform: scale(1.025);
}

.cw-viz-donut__segment-group:focus-visible .cw-viz-donut__focus-ring {
  opacity: 1;
}

.cw-viz-donut__segment-group--remainder:hover .cw-viz-donut__segment,
.cw-viz-donut__segment-group--remainder:focus-visible .cw-viz-donut__segment {
  filter: drop-shadow(0 3px 4px rgb(28 32 36 / 10%));
}

.cw-viz-donut__center {
  position: absolute;
  display: grid;
  inset: 25%;
  place-items: center;
  text-align: center;
  pointer-events: none;
}

.cw-viz-donut__tooltip {
  position: absolute;
  z-index: 3;
  display: grid;
  width: max-content;
  max-width: min(18rem, calc(100% - 1rem));
  gap: 0.25rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--cw-viz-donut-tooltip-border-color, #e0e1e6);
  border-radius: 0.375rem;
  color: var(--cw-viz-donut-tooltip-label-color, #60646c);
  background: var(--cw-viz-donut-tooltip-background, #ffffff);
  box-shadow: var(--cw-viz-donut-tooltip-shadow, 0 4px 16px rgb(0 0 0 / 10%));
  font-size: var(--cw-viz-donut-tooltip-font-size, 12px);
  line-height: 1.3;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 0.5rem));
}

.cw-viz-donut__tooltip-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.cw-viz-donut__tooltip-description {
  color: var(--cw-viz-donut-tooltip-description-color, #8b8d98);
  font-size: var(--cw-viz-donut-tooltip-description-font-size, 11px);
  overflow-wrap: anywhere;
}

.cw-viz-donut__tooltip--start {
  transform: translate(0, calc(-100% - 0.5rem));
}

.cw-viz-donut__tooltip--end {
  transform: translate(-100%, calc(-100% - 0.5rem));
}

.cw-viz-donut__tooltip strong {
  color: var(--cw-viz-donut-tooltip-value-color, #1c2024);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cw-viz-donut__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.625rem 1.25rem;
  margin: 1rem 0 0;
  padding: 0;
  font-size: var(--cw-viz-donut-legend-font-size, 12px);
  list-style: none;
}

.cw-viz-donut__legend li {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
}

.cw-viz-donut__legend strong {
  color: var(--cw-viz-donut-legend-value-color, #1c2024);
  font-size: inherit;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.cw-viz-donut__legend-item--remainder,
.cw-viz-donut__legend-item--remainder strong {
  color: var(--cw-viz-donut-remainder-label-color, #8b8d98);
}

.cw-viz-donut__swatch {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 999px;
  background: var(--cw-viz-donut-segment-color);
  box-shadow: inset 0 0 0 1px rgb(28 32 36 / 8%);
}

.cw-viz-donut__swatch--remainder {
  border: 1px solid var(--cw-viz-donut-remainder-swatch-border-color, #b9bbc6);
  box-shadow: none;
}

.cw-viz-donut__empty {
  margin: 0;
  padding: 3rem 1rem;
  color: var(--cw-viz-donut-label-color, #60646c);
  font-size: 12px;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .cw-viz-donut__segment,
  .cw-viz-donut__focus-ring {
    transition: none;
  }
}
</style>
