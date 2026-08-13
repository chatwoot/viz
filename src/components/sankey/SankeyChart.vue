<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

import { createSankeyLayout } from './sankey-layout.js'

defineOptions({ name: 'SankeyChart' })

const props = defineProps({
  ariaLabel: {
    type: String,
    default: 'Sankey diagram',
  },
  data: {
    type: Object,
    required: true,
  },
  formatValue: {
    type: Function,
    default: (value) => Number(value).toLocaleString(),
  },
  height: {
    type: Number,
    default: 340,
  },
  linkColor: {
    type: [Function, String],
    default: () => (link) => link.color,
  },
  linkValue: {
    type: Function,
    default: (link) => link.value ?? 1,
  },
  nodeColor: {
    type: [Function, String],
    default: () => (node) => node.color,
  },
  nodeId: {
    type: Function,
    default: (node) => node.id,
  },
  nodeLabel: {
    type: Function,
    default: (node) => node.label ?? node.id,
  },
  nodePadding: {
    type: Number,
    default: 28,
  },
  nodeValue: {
    type: Function,
    default: (node) => node.count ?? node.value ?? 0,
  },
  nodeWidth: {
    type: Number,
    default: 10,
  },
  onItemClick: {
    type: Function,
    default: undefined,
  },
  showLabelBackground: {
    type: Boolean,
    default: true,
  },
  width: {
    type: Number,
    default: 960,
  },
})

const chartRoot = useTemplateRef('chart-root')
const measuredWidth = ref(0)
let resizeObserver
let resizeFrame

const chartWidth = computed(() => Math.max(Math.round(measuredWidth.value || props.width), 320))
const layout = computed(() =>
  createSankeyLayout({
    data: props.data,
    formatValue: props.formatValue,
    height: props.height,
    linkColor: props.linkColor,
    linkValue: props.linkValue,
    nodeColor: props.nodeColor,
    nodeId: props.nodeId,
    nodeLabel: props.nodeLabel,
    nodePadding: props.nodePadding,
    nodeValue: props.nodeValue,
    nodeWidth: props.nodeWidth,
    width: chartWidth.value,
  }),
)
const description = computed(() => {
  if (layout.value.error) return layout.value.error
  return `${layout.value.nodes.length} nodes connected by ${layout.value.links.length} flows.`
})

function itemClickPayload(itemType, item, event) {
  if (itemType === 'node') {
    return {
      event,
      formattedValue: String(props.formatValue(item.displayValue, item.datum)),
      id: item.id,
      index: item.index,
      item: item.datum,
      itemType,
      label: item.label,
      value: item.displayValue,
    }
  }

  return {
    event,
    formattedValue: String(props.formatValue(item.value, item.datum)),
    index: item.index,
    item: item.datum,
    itemType,
    source: item.source.datum,
    sourceId: item.source.id,
    sourceLabel: item.source.label,
    target: item.target.datum,
    targetId: item.target.id,
    targetLabel: item.target.label,
    value: item.value,
  }
}

function handleItemClick(itemType, item, event) {
  if (!props.onItemClick) return
  props.onItemClick(itemClickPayload(itemType, item, event))
}

function handleItemKeydown(itemType, item, event) {
  if (!props.onItemClick || !['Enter', ' '].includes(event.key)) return

  event.preventDefault()
  handleItemClick(itemType, item, event)
}

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
  <div ref="chart-root" class="cw-viz-sankey">
    <svg
      class="cw-viz-sankey__svg"
      :viewBox="`0 0 ${chartWidth} ${height}`"
      role="img"
      :aria-label="ariaLabel"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{{ ariaLabel }}</title>
      <desc>{{ description }}</desc>

      <text
        v-if="layout.error || !layout.nodes.length"
        class="cw-viz-sankey__empty"
        x="50%"
        y="50%"
        text-anchor="middle"
      >
        {{ layout.error || 'No Sankey data to display.' }}
      </text>

      <g v-else>
        <g class="cw-viz-sankey__links" data-viz-layer="links">
          <g
            v-for="link in layout.links"
            :key="link.index"
            class="cw-viz-sankey__link-group"
            :class="{ 'cw-viz-sankey__link-group--clickable': onItemClick }"
            :tabindex="onItemClick ? 0 : undefined"
            :role="onItemClick ? 'button' : undefined"
            :aria-label="`${link.source.label} to ${link.target.label}: ${formatValue(link.value, link.datum)}`"
            @click="handleItemClick('link', link, $event)"
            @keydown="handleItemKeydown('link', link, $event)"
          >
            <path
              class="cw-viz-sankey__link"
              :d="link.path"
              :fill="link.color"
              :data-source="link.source.id"
              :data-target="link.target.id"
            />
            <path class="cw-viz-sankey__link-hit-area" :d="link.path" aria-hidden="true" />
            <title>
              {{ link.source.label }} to {{ link.target.label }}:
              {{ formatValue(link.value, link.datum) }}
            </title>
          </g>
        </g>

        <g class="cw-viz-sankey__nodes" data-viz-layer="nodes">
          <g
            v-for="node in layout.nodes"
            :key="node.id"
            class="cw-viz-sankey__node-group"
            :class="{ 'cw-viz-sankey__node-group--clickable': onItemClick }"
            :data-node-id="node.id"
            :tabindex="onItemClick ? 0 : undefined"
            :role="onItemClick ? 'button' : undefined"
            :aria-label="`${node.label}: ${formatValue(node.displayValue, node.datum)}`"
            @click="handleItemClick('node', node, $event)"
            @keydown="handleItemKeydown('node', node, $event)"
          >
            <rect
              class="cw-viz-sankey__node"
              :x="node.x"
              :y="node.y"
              :width="node.width"
              :height="node.height"
              :fill="node.color"
              rx="2"
            >
              <title>{{ node.label }}: {{ formatValue(node.displayValue, node.datum) }}</title>
            </rect>

            <g
              class="cw-viz-sankey__label"
              :transform="`translate(${node.labelLayout.x} ${node.labelLayout.y})`"
            >
              <rect
                v-if="showLabelBackground"
                class="cw-viz-sankey__label-background"
                :class="{
                  'cw-viz-sankey__label-background--terminal': node.labelLayout.isTerminal,
                }"
                :width="node.labelLayout.width"
                :height="node.labelLayout.height"
                rx="6"
              />
              <text
                class="cw-viz-sankey__label-text"
                :x="node.labelLayout.labelX"
                :y="node.labelLayout.height / 2"
                dominant-baseline="central"
              >
                {{ node.labelLayout.text }}
              </text>
              <line
                class="cw-viz-sankey__label-divider"
                :x1="node.labelLayout.separatorX"
                :x2="node.labelLayout.separatorX"
                y1="6"
                :y2="node.labelLayout.height - 6"
              />
              <text
                class="cw-viz-sankey__label-value"
                :x="node.labelLayout.countX"
                :y="node.labelLayout.height / 2"
                dominant-baseline="central"
                text-anchor="end"
              >
                {{ node.labelLayout.value }}
              </text>
              <title>{{ node.label }}: {{ node.labelLayout.value }}</title>
            </g>
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.cw-viz-sankey {
  width: 100%;
  min-width: 0;
  color: var(--cw-viz-sankey-label-color, #60646c);
  font-family: inherit;
}

.cw-viz-sankey__svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.cw-viz-sankey__link {
  opacity: var(--cw-viz-sankey-link-opacity, 0.2);
  pointer-events: none;
  transition: opacity 150ms ease;
}

.cw-viz-sankey__link-hit-area {
  fill: transparent;
  stroke: transparent;
  stroke-width: var(--cw-viz-sankey-link-hit-width, 12px);
  pointer-events: all;
  vector-effect: non-scaling-stroke;
}

.cw-viz-sankey__link-group--clickable,
.cw-viz-sankey__node-group--clickable {
  cursor: pointer;
}

.cw-viz-sankey__link-group:hover .cw-viz-sankey__link,
.cw-viz-sankey__link-group:focus .cw-viz-sankey__link {
  opacity: var(--cw-viz-sankey-link-hover-opacity, 0.34);
}

.cw-viz-sankey__node {
  opacity: var(--cw-viz-sankey-node-opacity, 1);
}

.cw-viz-sankey__node-group:focus .cw-viz-sankey__node {
  stroke: var(--cw-viz-sankey-focus-color, #3e63dd);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.cw-viz-sankey__label-background {
  fill: var(--cw-viz-sankey-label-background, #fcfcfd);
  stroke: var(--cw-viz-sankey-label-border-color, #ebebef);
  stroke-width: 1;
}

.cw-viz-sankey__label-background--terminal {
  stroke: none;
}

.cw-viz-sankey__label-text,
.cw-viz-sankey__label-value,
.cw-viz-sankey__empty {
  fill: currentcolor;
  font-size: var(--cw-viz-sankey-label-font-size, 13px);
}

.cw-viz-sankey__label-text {
  font-weight: 400;
}

.cw-viz-sankey__label-value {
  fill: var(--cw-viz-sankey-label-value-color, #1c2024);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.cw-viz-sankey__label-divider {
  stroke: var(--cw-viz-sankey-label-border-color, #ebebef);
  stroke-width: 1;
}

@media (prefers-reduced-motion: reduce) {
  .cw-viz-sankey__link {
    transition: none;
  }
}
</style>
