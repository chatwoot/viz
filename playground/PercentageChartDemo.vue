<script setup>
import { computed } from 'vue'

import { PercentageChart } from '../src/index.js'

defineOptions({ name: 'PercentageChartDemo' })

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const creditUsage = computed(() => findExample('credit-usage'))
const storage = computed(() => findExample('storage'))
const ratingDistribution = computed(() => findExample('rating-distribution'))
const storageSummary = computed(() => {
  const segments = Array.isArray(storage.value.segments) ? storage.value.segments : []
  const total = Number(storage.value.total)
  if (!Number.isFinite(total)) return ''

  const used = segments.reduce((sum, segment) => {
    const value = Number(segment.value)
    return Number.isFinite(value) && value > 0 ? sum + value : sum
  }, 0)

  return `${formatStorageValue(used)} of ${formatStorageValue(total)} used`
})

const ratingIcons = {
  average: '😐',
  excellent: '😍',
  fair: '😑',
  good: '😀',
  poor: '😞',
}

function findExample(id) {
  const examples = Array.isArray(props.data.examples) ? props.data.examples : []
  return examples.find((example) => example.id === id) ?? { segments: [] }
}

function formatRatingPercentage(value) {
  return `${Number(value).toFixed(2)}%`
}

function formatStorageValue(value) {
  return `${Number(value).toLocaleString()} GB`
}
</script>

<template>
  <div class="percentage-chart-demo">
    <section class="percentage-chart-demo__example">
      <header class="percentage-chart-demo__header">
        <h3>Credit usage</h3>
        <p>100% allocated</p>
      </header>
      <PercentageChart :data="creditUsage" aria-label="Credit usage breakdown" />
    </section>

    <section class="percentage-chart-demo__example">
      <header class="percentage-chart-demo__header">
        <h3>Storage</h3>
        <p v-if="storageSummary">{{ storageSummary }}</p>
      </header>
      <PercentageChart
        :data="storage"
        :format-value="formatStorageValue"
        aria-label="Storage usage by type"
      >
        <template #legend-item="{ color, formattedValue, isRemainder, label }">
          <span
            class="percentage-chart-demo__swatch"
            :class="{ 'percentage-chart-demo__swatch--remainder': isRemainder }"
            :style="{ backgroundColor: color }"
            aria-hidden="true"
          />
          <span>{{ label }}</span>
          <strong class="percentage-chart-demo__legend-value">{{ formattedValue }}</strong>
        </template>
      </PercentageChart>
    </section>

    <section class="percentage-chart-demo__example percentage-chart-demo__example--ratings">
      <header class="percentage-chart-demo__header">
        <h3>Rating distribution</h3>
      </header>
      <PercentageChart
        :data="ratingDistribution"
        :format-percentage="formatRatingPercentage"
        aria-label="Rating distribution"
      >
        <template #legend-item="{ formattedPercentage, formattedValue, id, label }">
          <span class="percentage-chart-demo__rating-icon" aria-hidden="true">
            {{ ratingIcons[id] }}
          </span>
          <span>{{ label }}</span>
          <strong class="percentage-chart-demo__legend-value">{{ formattedPercentage }}</strong>
          <span class="percentage-chart-demo__legend-detail">({{ formattedValue }})</span>
        </template>
      </PercentageChart>
    </section>
  </div>
</template>

<style scoped>
.percentage-chart-demo {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: 2rem;
  container-type: inline-size;
}

.percentage-chart-demo__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.875rem;
}

.percentage-chart-demo__header h3,
.percentage-chart-demo__header p {
  margin: 0;
  line-height: 1.3;
}

.percentage-chart-demo__header h3 {
  color: #1c2024;
  font-size: 14px;
  font-weight: 600;
}

.percentage-chart-demo__header p {
  color: #60646c;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.percentage-chart-demo__swatch {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgb(28 32 36 / 8%);
}

.percentage-chart-demo__swatch--remainder {
  border: 1px solid #b9bbc6;
  box-shadow: none;
}

.percentage-chart-demo__rating-icon {
  display: inline-grid;
  min-width: 1em;
  place-items: center;
  font-size: 16px;
  line-height: 1;
}

.percentage-chart-demo__legend-value {
  color: #1c2024;
  font-size: inherit;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.percentage-chart-demo__legend-detail {
  color: #8b8d98;
  font-variant-numeric: tabular-nums;
}

@container (max-width: 440px) {
  .percentage-chart-demo__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.25rem;
  }

  .percentage-chart-demo__header p {
    text-align: left;
  }
}
</style>
