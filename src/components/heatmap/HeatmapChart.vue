<script setup>
import { computed, ref, useTemplateRef } from 'vue'

import { createHeatmapLayout } from './heatmap-layout.js'

defineOptions({ name: 'HeatmapChart' })

const DEFAULT_LEVEL_COLORS = [
  'var(--cw-viz-heatmap-level-0-color, #f8f8fa)',
  'var(--cw-viz-heatmap-level-1-color, #e2efff)',
  'var(--cw-viz-heatmap-level-2-color, #bdd9fb)',
  'var(--cw-viz-heatmap-level-3-color, #8ab6f0)',
  'var(--cw-viz-heatmap-level-4-color, #1c73dc)',
]

const props = defineProps({
  ariaLabel: {
    type: String,
    default: 'Heatmap chart',
  },
  cellColor: {
    type: [Function, String],
    default: () => (cell) => cell?.color,
  },
  cellHeight: {
    type: Number,
    default: 32,
  },
  cellMinWidth: {
    type: Number,
    default: 28,
  },
  cellValue: {
    type: Function,
    default: (cell) => (typeof cell === 'number' ? cell : (cell?.value ?? cell?.count)),
  },
  columnId: {
    type: Function,
    default: (column, index) => column?.id ?? index,
  },
  columnLabel: {
    type: Function,
    default: (column) => column?.label ?? column,
  },
  colors: {
    type: Array,
    default: undefined,
  },
  data: {
    type: Object,
    required: true,
  },
  domain: {
    type: Array,
    default: undefined,
  },
  formatValue: {
    type: [Function, String],
    default: () => (value) => Number(value).toLocaleString(),
  },
  gap: {
    type: Number,
    default: 4,
  },
  onItemClick: {
    type: Function,
    default: undefined,
  },
  rowDescription: {
    type: Function,
    default: (row) => row?.description ?? row?.sublabel ?? '',
  },
  rowId: {
    type: Function,
    default: (row, index) => row?.id ?? index,
  },
  rowLabel: {
    type: Function,
    default: (row, index) => row?.label ?? row?.id ?? index,
  },
  rowLabelWidth: {
    type: Number,
    default: 120,
  },
  rowValues: {
    type: Function,
    default: (row) => row?.data ?? row?.values ?? [],
  },
  showTooltip: {
    type: Boolean,
    default: true,
  },
})

const chartRoot = useTemplateRef('chart-root')
const activeCell = ref(null)
const palette = computed(() => {
  const colors = Array.isArray(props.colors)
    ? props.colors.filter((color) => typeof color === 'string' && color.trim())
    : []
  return colors.length ? colors : DEFAULT_LEVEL_COLORS
})

const layout = computed(() =>
  createHeatmapLayout({
    cellColor: props.cellColor,
    cellValue: props.cellValue,
    columnId: props.columnId,
    columnLabel: props.columnLabel,
    data: props.data,
    domain: props.domain,
    formatValue: props.formatValue,
    levelCount: palette.value.length,
    rowDescription: props.rowDescription,
    rowId: props.rowId,
    rowLabel: props.rowLabel,
    rowValues: props.rowValues,
  }),
)
const gridStyle = computed(() => {
  const cellMinWidth = Math.max(props.cellMinWidth, 1)
  const columnCount = layout.value.columns.length
  const gap = Math.max(props.gap, 0)
  const rowLabelWidth = Math.max(props.rowLabelWidth, 1)

  return {
    '--cw-viz-heatmap-cell-height': `${Math.max(props.cellHeight, 1)}px`,
    '--cw-viz-heatmap-cell-min-width': `${cellMinWidth}px`,
    '--cw-viz-heatmap-column-count': columnCount,
    '--cw-viz-heatmap-gap': `${gap}px`,
    '--cw-viz-heatmap-grid-min-width': `${rowLabelWidth + columnCount * cellMinWidth + columnCount * gap}px`,
    '--cw-viz-heatmap-row-label-width': `${rowLabelWidth}px`,
  }
})
const description = computed(() => {
  if (layout.value.error) return layout.value.error
  return `${layout.value.rows.length} rows across ${layout.value.columns.length} columns.`
})
const tooltip = computed(() => {
  if (!props.showTooltip || !activeCell.value) return null

  const row = layout.value.rows[activeCell.value.rowIndex]
  const cell = row?.cells[activeCell.value.columnIndex]
  if (!row || cell?.value === undefined) return null

  return {
    column: cell.column.label,
    formattedValue: cell.formattedValue,
    horizontalPosition: activeCell.value.horizontalPosition,
    rowDescription: row.description,
    rowLabel: row.label,
    showBelow: activeCell.value.showBelow,
    x: activeCell.value.x,
    y: activeCell.value.y,
  }
})

function openTooltip(rowIndex, columnIndex, event) {
  if (!props.showTooltip) return

  const rootBounds = chartRoot.value?.getBoundingClientRect()
  const cellBounds = event.currentTarget?.getBoundingClientRect()
  if (!rootBounds || !cellBounds) return

  const x = cellBounds.left - rootBounds.left + cellBounds.width / 2
  const y = cellBounds.top - rootBounds.top + cellBounds.height / 2
  activeCell.value = {
    columnIndex,
    horizontalPosition:
      x < rootBounds.width * 0.25 ? 'start' : x > rootBounds.width * 0.75 ? 'end' : 'center',
    rowIndex,
    showBelow: y < 96,
    x,
    y,
  }
}

function closeTooltip() {
  activeCell.value = null
}

function cellStyle(cell) {
  if (cell.color) return { backgroundColor: cell.color }
  return { backgroundColor: palette.value[cell.level] }
}

function selectCell(row, cell, event) {
  if (!props.onItemClick) return

  props.onItemClick({
    column: cell.column.datum,
    columnId: cell.column.id,
    columnIndex: cell.column.index,
    columnLabel: cell.column.label,
    event,
    formattedValue: cell.formattedValue,
    item: cell.datum,
    itemType: 'cell',
    row: row.datum,
    rowDescription: row.description,
    rowId: row.id,
    rowIndex: row.index,
    rowLabel: row.label,
    value: cell.value,
  })
}
</script>

<template>
  <div ref="chart-root" class="cw-viz-heatmap" role="group" :aria-label="ariaLabel">
    <p class="cw-viz-heatmap__description">{{ description }}</p>

    <p v-if="layout.error" class="cw-viz-heatmap__empty">{{ layout.error }}</p>

    <div v-else class="cw-viz-heatmap__scroll">
      <div class="cw-viz-heatmap__grid" :style="gridStyle" role="grid">
        <div v-for="row in layout.rows" :key="row.id" class="cw-viz-heatmap__row" role="row">
          <div class="cw-viz-heatmap__row-label" role="rowheader">
            <strong>{{ row.label }}</strong>
            <span v-if="row.description">{{ row.description }}</span>
          </div>

          <template v-for="cell in row.cells" :key="cell.id">
            <component
              v-if="cell.value !== undefined"
              :is="showTooltip || onItemClick ? 'button' : 'span'"
              :type="showTooltip || onItemClick ? 'button' : undefined"
              class="cw-viz-heatmap__cell"
              :class="`cw-viz-heatmap__cell--level-${cell.level}`"
              :style="cellStyle(cell)"
              role="gridcell"
              :aria-label="`${row.label}, ${cell.column.label}: ${cell.formattedValue}`"
              @pointerenter="openTooltip(row.index, cell.column.index, $event)"
              @pointerleave="closeTooltip"
              @focus="openTooltip(row.index, cell.column.index, $event)"
              @blur="closeTooltip"
              @keydown.esc="closeTooltip"
              @click="selectCell(row, cell, $event)"
            />
            <span v-else class="cw-viz-heatmap__cell cw-viz-heatmap__cell--empty" role="gridcell" />
          </template>
        </div>

        <div class="cw-viz-heatmap__row cw-viz-heatmap__header-row" role="row">
          <span aria-hidden="true" />
          <span
            v-for="column in layout.columns"
            :key="column.id"
            class="cw-viz-heatmap__column-label"
            role="columnheader"
          >
            {{ column.label }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="tooltip"
      class="cw-viz-heatmap__tooltip"
      :class="[
        `cw-viz-heatmap__tooltip--${tooltip.horizontalPosition}`,
        { 'cw-viz-heatmap__tooltip--below': tooltip.showBelow },
      ]"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      role="tooltip"
    >
      <p class="cw-viz-heatmap__tooltip-title">
        {{ tooltip.rowLabel }}
        <span v-if="tooltip.rowDescription">{{ tooltip.rowDescription }}</span>
      </p>
      <div class="cw-viz-heatmap__tooltip-row">
        <span>{{ tooltip.column }}</span>
        <strong>{{ tooltip.formattedValue }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cw-viz-heatmap {
  position: relative;
  width: 100%;
  min-width: 0;
  color: var(--cw-viz-heatmap-label-color, #60646c);
  font-family: inherit;
}

.cw-viz-heatmap__description {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.cw-viz-heatmap__scroll {
  width: 100%;
  max-height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
}

.cw-viz-heatmap__grid {
  display: grid;
  min-width: var(--cw-viz-heatmap-grid-min-width);
  gap: var(--cw-viz-heatmap-gap);
  grid-template-columns:
    var(--cw-viz-heatmap-row-label-width)
    repeat(var(--cw-viz-heatmap-column-count), minmax(var(--cw-viz-heatmap-cell-min-width), 1fr));
}

.cw-viz-heatmap__row {
  display: contents;
}

.cw-viz-heatmap__row-label {
  position: sticky;
  left: 0;
  z-index: 1;
  display: flex;
  height: var(--cw-viz-heatmap-cell-height);
  align-items: flex-end;
  justify-content: center;
  flex-direction: column;
  padding-right: 0.75rem;
  background: var(--cw-viz-heatmap-label-background, #ffffff);
  text-align: right;
}

.cw-viz-heatmap__row-label strong {
  color: var(--cw-viz-heatmap-row-title-color, #1c2024);
  font-size: var(--cw-viz-heatmap-row-title-font-size, 12px);
  font-weight: 600;
}

.cw-viz-heatmap__row-label span {
  margin-top: 0.18rem;
  font-size: var(--cw-viz-heatmap-row-description-font-size, 11px);
}

.cw-viz-heatmap__cell {
  display: block;
  min-width: 0;
  height: var(--cw-viz-heatmap-cell-height);
  min-height: 0;
  padding: 0;
  border: 1px solid var(--cw-viz-heatmap-cell-border-color, rgb(62 99 221 / 8%));
  border-radius: var(--cw-viz-heatmap-cell-radius, 3px);
  background: var(--cw-viz-heatmap-level-0-color, #f8f8fa);
  cursor: default;
  transition:
    filter 120ms ease,
    transform 120ms ease;
}

button.cw-viz-heatmap__cell {
  cursor: pointer;
}

.cw-viz-heatmap__cell:hover {
  z-index: 1;
  filter: brightness(0.96);
}

.cw-viz-heatmap__cell:focus {
  outline: none;
}

.cw-viz-heatmap__cell:focus-visible {
  z-index: 1;
  filter: brightness(0.96);
  outline: 1px solid var(--cw-viz-heatmap-focus-color, rgb(96 100 108 / 45%));
  outline-offset: -1px;
}

.cw-viz-heatmap__cell--level-0,
.cw-viz-heatmap__cell--empty {
  background: var(--cw-viz-heatmap-level-0-color, #f8f8fa);
}

.cw-viz-heatmap__cell--level-1 {
  background: var(--cw-viz-heatmap-level-1-color, #e2efff);
}

.cw-viz-heatmap__cell--level-2 {
  background: var(--cw-viz-heatmap-level-2-color, #bdd9fb);
}

.cw-viz-heatmap__cell--level-3 {
  background: var(--cw-viz-heatmap-level-3-color, #8ab6f0);
}

.cw-viz-heatmap__cell--level-4 {
  background: var(--cw-viz-heatmap-level-4-color, #1c73dc);
}

.cw-viz-heatmap__header-row > span {
  min-width: 0;
  height: 1.5rem;
}

.cw-viz-heatmap__column-label {
  display: grid;
  place-items: end center;
  color: var(--cw-viz-heatmap-column-label-color, #1c2024);
  font-size: var(--cw-viz-heatmap-column-label-font-size, 10px);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.cw-viz-heatmap__empty {
  margin: 0;
  padding: 3rem 1rem;
  font-size: 12px;
  text-align: center;
}

.cw-viz-heatmap__tooltip {
  position: absolute;
  z-index: 3;
  min-width: 10rem;
  max-width: min(18rem, calc(100% - 1rem));
  padding: 0.75rem;
  border: 1px solid var(--cw-viz-heatmap-tooltip-border-color, #e0e1e6);
  border-radius: 6px;
  color: var(--cw-viz-heatmap-tooltip-color, #1c2024);
  background: var(--cw-viz-heatmap-tooltip-background, #ffffff);
  box-shadow: var(--cw-viz-heatmap-tooltip-shadow, 0 4px 16px rgb(0 0 0 / 10%));
  font-size: var(--cw-viz-heatmap-tooltip-font-size, 12px);
  line-height: 1.35;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 12px));
}

.cw-viz-heatmap__tooltip--start {
  transform: translate(0, calc(-100% - 12px));
}

.cw-viz-heatmap__tooltip--end {
  transform: translate(-100%, calc(-100% - 12px));
}

.cw-viz-heatmap__tooltip--below {
  transform: translate(-50%, 12px);
}

.cw-viz-heatmap__tooltip--below.cw-viz-heatmap__tooltip--start {
  transform: translate(0, 12px);
}

.cw-viz-heatmap__tooltip--below.cw-viz-heatmap__tooltip--end {
  transform: translate(-100%, 12px);
}

.cw-viz-heatmap__tooltip-title {
  display: grid;
  margin: 0 0 0.5rem;
  color: var(--cw-viz-heatmap-tooltip-label-color, #60646c);
  font-weight: 500;
}

.cw-viz-heatmap__tooltip-title span {
  margin-top: 0.15rem;
  font-size: 0.9em;
  font-weight: 400;
}

.cw-viz-heatmap__tooltip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.cw-viz-heatmap__tooltip-row strong {
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .cw-viz-heatmap__cell {
    transition: none;
  }
}
</style>
