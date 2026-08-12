<script setup>
import { computed, ref, watch } from 'vue'

import { SankeyChart } from '../src/index.js'
import { DEFAULT_DATA } from './sample-data.js'

const STORAGE_KEY = 'chatwoot-viz:sankey-data'
const source = ref(localStorage.getItem(STORAGE_KEY) ?? DEFAULT_DATA)

const result = computed(() => {
  try {
    return { data: JSON.parse(source.value), error: '' }
  } catch (error) {
    return { data: null, error: error.message }
  }
})

watch(
  source,
  (value) => {
    localStorage.setItem(STORAGE_KEY, value)
  },
  { immediate: true },
)

function formatData() {
  if (result.value.data) {
    source.value = JSON.stringify(result.value.data, null, 2)
  }
}

function resetData() {
  source.value = DEFAULT_DATA
}
</script>

<template>
  <main class="playground">
    <header class="playground__header">
      <div>
        <p class="eyebrow">@chatwoot/viz</p>
        <h1>Sankey chart playground</h1>
        <p>Edit the nodes and links to see the responsive SVG update.</p>
      </div>
      <div class="actions">
        <button type="button" @click="formatData">Format JSON</button>
        <button type="button" class="button--quiet" @click="resetData">Reset sample</button>
      </div>
    </header>

    <section class="workspace">
      <div class="editor-panel">
        <label for="sankey-data">Chart data</label>
        <textarea
          id="sankey-data"
          v-model="source"
          spellcheck="false"
          aria-describedby="json-status"
        />
        <p
          id="json-status"
          class="status"
          :class="{ 'status--error': result.error }"
          aria-live="polite"
        >
          {{ result.error ? `Invalid JSON: ${result.error}` : 'Valid JSON' }}
        </p>
      </div>

      <div class="chart-panel">
        <SankeyChart
          v-if="result.data"
          :data="result.data"
          aria-label="Conversation resolution flow"
        />
        <div v-else class="empty-state">Fix the JSON to render the Sankey chart.</div>
      </div>
    </section>
  </main>
</template>
