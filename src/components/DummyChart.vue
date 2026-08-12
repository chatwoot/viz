<script setup>
import { computed } from 'vue'

defineOptions({ name: 'DummyChart' })

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  height: {
    type: Number,
    default: 420,
  },
  width: {
    type: Number,
    default: 720,
  },
})

const bars = computed(() => {
  const entries = Object.entries(props.data)
  const scores = entries.map(([, value]) => {
    if (Array.isArray(value)) return value.length
    if (value && typeof value === 'object') return Object.keys(value).length
    if (typeof value === 'number') return Math.abs(value)
    return String(value ?? '').length
  })
  const maximum = Math.max(...scores, 1)
  const chartHeight = props.height - 96
  const slotWidth = (props.width - 96) / Math.max(entries.length, 1)

  return entries.map(([label], index) => {
    const barHeight = (scores[index] / maximum) * chartHeight

    return {
      height: barHeight,
      label,
      score: scores[index],
      width: Math.max(slotWidth - 16, 1),
      x: 48 + index * slotWidth + 8,
      y: props.height - 48 - barHeight,
    }
  })
})
</script>

<template>
  <svg
    class="cw-viz-dummy"
    :viewBox="`0 0 ${width} ${height}`"
    role="img"
    aria-label="Dummy chart generated from JSON"
  >
    <title>Dummy chart generated from JSON</title>
    <g data-viz-layer="dummy-bars">
      <g v-for="bar in bars" :key="bar.label">
        <rect
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="bar.height"
          rx="4"
          fill="currentColor"
          opacity="0.75"
        >
          <title>{{ bar.label }}: {{ bar.score }}</title>
        </rect>
        <text
          :x="bar.x + bar.width / 2"
          :y="height - 24"
          text-anchor="middle"
          fill="currentColor"
          font-size="13"
        >
          {{ bar.label }}
        </text>
      </g>
    </g>
  </svg>
</template>
