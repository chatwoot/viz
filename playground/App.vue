<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import { LineChart, SankeyChart } from '../src/index.js'
import { DEFAULT_LINE_DATA, DEFAULT_SANKEY_DATA } from './sample-data.js'

const SHIKI_CDN_URL = 'https://esm.sh/shiki@4.4.3'
const DEFAULT_CANVAS_HEIGHT = 380
const MIN_CANVAS_HEIGHT = 260
const pages = [
  { id: 'home', label: 'Home', path: '/' },
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

function pageFromPath(pathname) {
  return pages.find((page) => page.path === pathname)?.id ?? 'home'
}

function pathForPage(pageId) {
  return pages.find((page) => page.id === pageId)?.path ?? '/'
}

function savedSource(chart) {
  return localStorage.getItem(dataStorageKey(chart)) ?? defaultData[chart]
}

function parseSource(source, fallback) {
  try {
    return JSON.parse(source)
  } catch {
    return JSON.parse(fallback)
  }
}

const activePage = ref(pageFromPath(window.location.pathname))
const drafts = ref({
  line: savedSource('line'),
  sankey: savedSource('sankey'),
})
const source = ref(activePage.value === 'home' ? drafts.value.line : drafts.value[activePage.value])
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
const homeData = computed(() => ({
  line: parseSource(drafts.value.line, DEFAULT_LINE_DATA),
  sankey: parseSource(drafts.value.sankey, DEFAULT_SANKEY_DATA),
}))

watch(source, (value) => {
  if (activePage.value === 'home') return
  drafts.value[activePage.value] = value
  localStorage.setItem(dataStorageKey(activePage.value), value)
})

watch(activePage, (page, previousPage) => {
  if (previousPage !== 'home') {
    drafts.value[previousPage] = source.value
    localStorage.setItem(dataStorageKey(previousPage), source.value)
  }

  if (page !== 'home') source.value = drafts.value[page]

  const path = pathForPage(page)
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
  if (activePage.value !== 'home') source.value = defaultData[activePage.value]
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

function navigateTo(page) {
  activePage.value = page
}

function syncPageFromPath() {
  activePage.value = pageFromPath(window.location.pathname)
}

onMounted(() => {
  const activePath = pathForPage(activePage.value)
  if (window.location.pathname !== activePath) window.history.replaceState({}, '', activePath)
  window.addEventListener('popstate', syncPageFromPath)

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
  window.removeEventListener('popstate', syncPageFromPath)
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
        <strong>chatwoot/viz</strong>
      </div>
      <nav class="story-nav" aria-label="Chart stories">
        <a
          v-for="page in pages"
          :key="page.id"
          class="story-nav__link"
          :class="{ 'story-nav__link--active': activePage === page.id }"
          :href="page.path"
          :aria-current="activePage === page.id ? 'page' : undefined"
          @click.prevent="navigateTo(page.id)"
        >
          {{ page.label }}
        </a>
      </nav>
    </header>

    <section v-if="activePage === 'home'" class="home-page">
      <section class="home-chart" aria-labelledby="home-sankey-title">
        <h2 id="home-sankey-title">Sankey</h2>
        <SankeyChart :data="homeData.sankey" aria-label="Conversation resolution flow" />
      </section>

      <section class="home-chart" aria-labelledby="home-line-title">
        <h2 id="home-line-title">Line</h2>
        <LineChart :data="homeData.line" aria-label="Conversation trends by week" />
      </section>
    </section>

    <section v-else class="workspace">
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
              v-if="result.data && activePage === 'line'"
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
            <div v-else class="empty-state">Fix the JSON to render the {{ activePage }} chart.</div>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
