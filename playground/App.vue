<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import { LineChart, SankeyChart } from '../src/index.js'
import { DEFAULT_LINE_DATA, DEFAULT_SANKEY_DATA } from './sample-data.js'

const SHIKI_CDN_URL = 'https://esm.sh/shiki@4.4.3'
const DEFAULT_CANVAS_HEIGHT = 380
const MIN_CANVAS_HEIGHT = 260
const charts = [
  { id: 'sankey', label: 'Sankey', path: '/sankey' },
  { id: 'line', label: 'Line', path: '/line' },
]
const defaultData = {
  line: DEFAULT_LINE_DATA,
  sankey: DEFAULT_SANKEY_DATA,
}

function dataStorageKey(chart) {
  return `chatwoot-viz:${chart}-data`
}

function chartFromPath(pathname) {
  return charts.find((chart) => chart.path === pathname)?.id ?? 'line'
}

function pathForChart(chartId) {
  return charts.find((chart) => chart.id === chartId)?.path ?? '/line'
}

const activeChart = ref(chartFromPath(window.location.pathname))
const source = ref(
  localStorage.getItem(dataStorageKey(activeChart.value)) ?? defaultData[activeChart.value],
)
const canvasHeight = ref(DEFAULT_CANVAS_HEIGHT)
const highlightedCode = ref('')
const hasHighlighting = ref(false)
const canvasFrame = useTemplateRef('canvas-frame')
const highlightedEditor = useTemplateRef('highlighted-editor')
let canvasObserver
let canvasResizeFrame
let codeToHtml
let highlightRequest = 0
let highlightTimer

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
    localStorage.setItem(dataStorageKey(activeChart.value), value)
  },
  { immediate: true },
)

watch(activeChart, (chart, previousChart) => {
  localStorage.setItem(dataStorageKey(previousChart), source.value)
  source.value = localStorage.getItem(dataStorageKey(chart)) ?? defaultData[chart]

  const path = pathForChart(chart)
  if (window.location.pathname !== path) window.history.pushState({}, '', path)
})

async function updateHighlight() {
  if (!codeToHtml) return

  const request = ++highlightRequest
  const html = await codeToHtml(source.value, { lang: 'json', theme: 'github-light' })
  if (request !== highlightRequest) return

  highlightedCode.value = html
  hasHighlighting.value = true
}

function scheduleHighlight() {
  clearTimeout(highlightTimer)
  highlightTimer = setTimeout(updateHighlight, 60)
}

function syncEditorScroll(event) {
  if (!highlightedEditor.value) return
  highlightedEditor.value.scrollTop = event.currentTarget.scrollTop
  highlightedEditor.value.scrollLeft = event.currentTarget.scrollLeft
}

function formatData() {
  if (result.value.data) source.value = JSON.stringify(result.value.data, null, 2)
}

function resetData() {
  source.value = defaultData[activeChart.value]
}

function fitCanvas() {
  if (!canvasFrame.value) return

  canvasFrame.value.style.width = '100%'
  canvasFrame.value.style.height = `${DEFAULT_CANVAS_HEIGHT}px`
  canvasHeight.value = DEFAULT_CANVAS_HEIGHT
}

function updateCanvasHeight(height) {
  if (!Number.isFinite(height) || height <= 0) return
  canvasHeight.value = Math.max(Math.round(height), MIN_CANVAS_HEIGHT)
}

function syncChartFromPath() {
  activeChart.value = chartFromPath(window.location.pathname)
}

onMounted(() => {
  const activePath = pathForChart(activeChart.value)
  if (window.location.pathname !== activePath) window.history.replaceState({}, '', activePath)
  window.addEventListener('popstate', syncChartFromPath)

  import(/* @vite-ignore */ SHIKI_CDN_URL)
    .then((shiki) => {
      codeToHtml = shiki.codeToHtml
      return updateHighlight()
    })
    .catch(() => {
      hasHighlighting.value = false
    })

  updateCanvasHeight(canvasFrame.value?.getBoundingClientRect().height)

  if (typeof ResizeObserver === 'undefined' || !canvasFrame.value) return

  canvasObserver = new ResizeObserver((entries) => {
    const height = entries[0]?.contentRect.height

    if (typeof requestAnimationFrame === 'undefined') {
      updateCanvasHeight(height)
      return
    }

    if (canvasResizeFrame) cancelAnimationFrame(canvasResizeFrame)
    canvasResizeFrame = requestAnimationFrame(() => {
      canvasResizeFrame = undefined
      updateCanvasHeight(height)
    })
  })
  canvasObserver.observe(canvasFrame.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncChartFromPath)
  highlightRequest += 1
  clearTimeout(highlightTimer)
  canvasObserver?.disconnect()
  if (canvasResizeFrame) cancelAnimationFrame(canvasResizeFrame)
})

watch(source, scheduleHighlight)
</script>

<template>
  <main class="playground">
    <header class="playground__header">
      <div class="brand">
        <strong>@chatwoot/viz</strong>
        <span aria-hidden="true">/</span>
        <select v-model="activeChart" class="story-select" aria-label="Chart story">
          <option v-for="chart in charts" :key="chart.id" :value="chart.id">
            {{ chart.label }}
          </option>
        </select>
      </div>
    </header>

    <section class="workspace">
      <aside class="editor-panel">
        <header class="panel-toolbar">
          <p class="panel-title">Data</p>
          <div class="editor-actions">
            <button type="button" class="button--quiet button--small" @click="formatData">
              Format
            </button>
            <button type="button" class="button--quiet button--small" @click="resetData">
              Reset
            </button>
          </div>
        </header>

        <div class="editor-body" :class="{ 'editor-body--highlighted': hasHighlighting }">
          <label class="sr-only" for="chart-data">Chart data</label>
          <div
            v-if="hasHighlighting"
            ref="highlighted-editor"
            class="editor-highlight"
            aria-hidden="true"
            v-html="highlightedCode"
          />
          <textarea
            id="chart-data"
            v-model="source"
            spellcheck="false"
            wrap="off"
            aria-describedby="json-status"
            @scroll="syncEditorScroll"
          />
        </div>

        <footer class="editor-footer">
          <p
            id="json-status"
            class="status"
            :class="{ 'status--error': result.error }"
            aria-live="polite"
          >
            {{ result.error ? `Invalid JSON: ${result.error}` : 'Valid JSON' }}
          </p>
        </footer>
      </aside>

      <section class="chart-panel">
        <header class="panel-toolbar canvas-toolbar">
          <p class="panel-title">Preview</p>
          <div class="canvas-actions">
            <span class="panel-hint">Resize from the lower-right corner</span>
            <button type="button" class="button--quiet button--small" @click="fitCanvas">
              Reset size
            </button>
          </div>
        </header>

        <div class="canvas-stage">
          <div ref="canvas-frame" class="canvas-frame">
            <LineChart
              v-if="result.data && activeChart === 'line'"
              :data="result.data"
              :height="canvasHeight"
              aria-label="Conversation trends by week"
            />
            <SankeyChart
              v-else-if="result.data"
              :data="result.data"
              :height="canvasHeight"
              aria-label="Conversation resolution flow"
            />
            <div v-else class="empty-state">
              Fix the JSON to render the {{ activeChart }} chart.
            </div>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
