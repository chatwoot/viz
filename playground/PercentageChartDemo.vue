<script setup>
import { PercentageChart } from '../src/index.js'

defineOptions({ name: 'PercentageChartDemo' })

defineProps({
  data: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="percentage-chart-demo">
    <PercentageChart
      v-for="example in data.examples"
      :key="example.id"
      :data="example"
      :format-value="example.unit ? ` ${example.unit}` : undefined"
      :aria-label="`${example.title} breakdown`"
    />
  </div>
</template>

<style scoped>
.percentage-chart-demo {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: 2rem;
}
</style>
