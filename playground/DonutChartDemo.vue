<script setup>
import { computed } from 'vue'

import { DonutChart } from '../src/index.js'

defineOptions({ name: 'DonutChartDemo' })

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const responseCount = computed(() => {
  const segments = Array.isArray(props.data.segments) ? props.data.segments : []

  return segments.reduce((sum, segment) => {
    const value = Number(segment.value)
    return Number.isFinite(value) && value > 0 ? sum + value : sum
  }, 0)
})

const ratingIcons = {
  average: '😐',
  excellent: '😍',
  fair: '😑',
  good: '😀',
  poor: '😞',
}

function formatRatingPercentage(value) {
  return `${Number(value).toFixed(2)}%`
}
</script>

<template>
  <section class="donut-chart-demo">
    <header class="donut-chart-demo__header">
      <h3>Rating distribution</h3>
    </header>
    <DonutChart
      :data="data"
      :format-percentage="formatRatingPercentage"
      :diameter="220"
      :thickness="26"
      aria-label="Rating distribution"
    >
      <template #center>
        <div class="donut-chart-demo__center">
          <strong>{{ responseCount }}</strong>
          <span>responses</span>
        </div>
      </template>
      <template #legend-item="{ formattedPercentage, formattedValue, id, label }">
        <span class="donut-chart-demo__rating-icon" aria-hidden="true">
          {{ ratingIcons[id] }}
        </span>
        <span>{{ label }}</span>
        <strong class="donut-chart-demo__legend-value">{{ formattedPercentage }}</strong>
        <span class="donut-chart-demo__legend-detail">({{ formattedValue }})</span>
      </template>
    </DonutChart>
  </section>
</template>

<style scoped>
.donut-chart-demo {
  width: 100%;
  min-width: 0;
}

.donut-chart-demo__header {
  margin-bottom: 0.875rem;
}

.donut-chart-demo__header h3 {
  margin: 0;
  color: #1c2024;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.donut-chart-demo__center {
  display: grid;
  gap: 0.125rem;
}

.donut-chart-demo__center strong {
  color: #1c2024;
  font-size: 1.5rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1;
}

.donut-chart-demo__center span {
  color: #8b8d98;
  font-size: 0.6875rem;
  line-height: 1.2;
}

.donut-chart-demo__rating-icon {
  display: inline-grid;
  min-width: 1em;
  place-items: center;
  font-size: 16px;
  line-height: 1;
}

.donut-chart-demo__legend-value {
  color: #1c2024;
  font-size: inherit;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.donut-chart-demo__legend-detail {
  color: #8b8d98;
  font-variant-numeric: tabular-nums;
}
</style>
