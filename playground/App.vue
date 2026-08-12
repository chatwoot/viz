<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import { BarChart, HeatmapChart, LineChart, SankeyChart } from '../src/index.js'
import BarDocs from './docs/bar.md'
import barDocsSource from './docs/bar.md?raw'
import HeatmapDocs from './docs/heatmap.md'
import heatmapDocsSource from './docs/heatmap.md?raw'
import LineDocs from './docs/line.md'
import lineDocsSource from './docs/line.md?raw'
import SankeyDocs from './docs/sankey.md'
import sankeyDocsSource from './docs/sankey.md?raw'
import {
  DEFAULT_BAR_DATA,
  DEFAULT_HEATMAP_DATA,
  DEFAULT_LINE_DATA,
  DEFAULT_SANKEY_DATA,
} from './sample-data.js'

const SHIKI_CDN_URL = 'https://esm.sh/shiki@4.4.3'
const DEFAULT_CANVAS_HEIGHT = 380
const MIN_CANVAS_HEIGHT = 260
const DEFAULT_DOCS_WIDTH = 360
const MIN_DOCS_WIDTH = 260
const MAX_DOCS_WIDTH = 560
const pages = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'sankey', label: 'Sankey', path: '/sankey' },
  { id: 'line', label: 'Line', path: '/line' },
  { id: 'bar', label: 'Bar', path: '/bar' },
  { id: 'heatmap', label: 'Heatmap', path: '/heatmap' },
]
const defaultData = {
  bar: DEFAULT_BAR_DATA,
  heatmap: DEFAULT_HEATMAP_DATA,
  line: DEFAULT_LINE_DATA,
  sankey: DEFAULT_SANKEY_DATA,
}
const docs = {
  bar: { component: BarDocs, source: barDocsSource, title: 'Bar Chart' },
  heatmap: { component: HeatmapDocs, source: heatmapDocsSource, title: 'Heatmap Chart' },
  line: { component: LineDocs, source: lineDocsSource, title: 'Line Chart' },
  sankey: { component: SankeyDocs, source: sankeyDocsSource, title: 'Sankey Chart' },
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
  bar: savedSource('bar'),
  heatmap: savedSource('heatmap'),
  line: savedSource('line'),
  sankey: savedSource('sankey'),
})
const source = ref(activePage.value === 'home' ? drafts.value.line : drafts.value[activePage.value])
const canvasHeight = ref(DEFAULT_CANVAS_HEIGHT)
const docsWidth = ref(DEFAULT_DOCS_WIDTH)
const docsOpen = ref(false)
const docsCopied = ref(false)
const highlightedCode = ref('')
const hasHighlighting = ref(false)
const canvasFrame = useTemplateRef('canvas-frame')
const highlightedEditor = useTemplateRef('highlighted-editor')
let canvasObserver
let canvasResizeFrame
let codeToHtml
let highlightRequest = 0
let highlightTimer
let docsCopyTimer
let stopDocsResize

const result = computed(() => {
  try {
    return { data: JSON.parse(source.value), error: '' }
  } catch (error) {
    return { data: null, error: error.message }
  }
})
const homeData = computed(() => ({
  bar: parseSource(drafts.value.bar, DEFAULT_BAR_DATA),
  heatmap: parseSource(drafts.value.heatmap, DEFAULT_HEATMAP_DATA),
  line: parseSource(drafts.value.line, DEFAULT_LINE_DATA),
  sankey: parseSource(drafts.value.sankey, DEFAULT_SANKEY_DATA),
}))
const activeDocs = computed(() => docs[activePage.value])

watch(source, (value) => {
  if (activePage.value === 'home') return
  drafts.value[activePage.value] = value
  localStorage.setItem(dataStorageKey(activePage.value), value)
})

watch(activePage, (page, previousPage) => {
  docsCopied.value = false
  if (previousPage !== 'home') {
    drafts.value[previousPage] = source.value
    localStorage.setItem(dataStorageKey(previousPage), source.value)
  }

  if (page !== 'home') source.value = drafts.value[page]
  else docsOpen.value = false

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

function setBarOption(option, enabled) {
  if (activePage.value !== 'bar' || !result.value.data) return

  source.value = JSON.stringify(
    {
      ...result.value.data,
      [option]: enabled,
    },
    null,
    2,
  )
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

function setDocsWidth(width) {
  docsWidth.value = Math.min(Math.max(Math.round(width), MIN_DOCS_WIDTH), MAX_DOCS_WIDTH)
}

function resizeDocsBy(amount) {
  setDocsWidth(docsWidth.value + amount)
}

function startDocsResize(event) {
  if (event.button !== 0) return

  event.preventDefault()
  const startX = event.clientX
  const startWidth = docsWidth.value

  function stop() {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    document.body.classList.remove('is-resizing-docs')
    stopDocsResize = undefined
  }

  function move(moveEvent) {
    setDocsWidth(startWidth + startX - moveEvent.clientX)
  }

  stopDocsResize?.()
  stopDocsResize = stop
  document.body.classList.add('is-resizing-docs')
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)
}

async function copyDocs() {
  if (!navigator.clipboard?.writeText || !activeDocs.value) return

  try {
    await navigator.clipboard.writeText(activeDocs.value.source)
    docsCopied.value = true
    clearTimeout(docsCopyTimer)
    docsCopyTimer = setTimeout(() => {
      docsCopied.value = false
    }, 1600)
  } catch {
    docsCopied.value = false
  }
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
  clearTimeout(docsCopyTimer)
  canvasObserver?.disconnect()
  stopDocsResize?.()
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
      <button
        v-if="activePage !== 'home'"
        type="button"
        class="button--quiet button--small docs-toggle"
        aria-controls="chart-docs"
        :aria-expanded="docsOpen"
        @click="docsOpen = !docsOpen"
      >
        Docs
      </button>
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

      <section class="home-chart" aria-labelledby="home-bar-title">
        <h2 id="home-bar-title">Bar</h2>
        <BarChart
          :data="homeData.bar"
          :stacked="Boolean(homeData.bar.stacked)"
          :timeseries="Boolean(homeData.bar.timeseries)"
          aria-label="Conversation volume by week"
        />
      </section>

      <section class="home-chart" aria-labelledby="home-heatmap-title">
        <h2 id="home-heatmap-title">Heatmap</h2>
        <HeatmapChart :data="homeData.heatmap" aria-label="Hourly activity by day" />
      </section>
    </section>

    <section
      v-else
      class="workspace"
      :class="{ 'workspace--docs-open': docsOpen }"
      :style="docsOpen ? { '--docs-panel-width': `${docsWidth}px` } : undefined"
    >
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
            <div v-if="activePage === 'bar'" class="chart-options" aria-label="Bar chart options">
              <label class="chart-option">
                <input
                  type="checkbox"
                  :checked="Boolean(result.data?.stacked)"
                  :disabled="!result.data"
                  @change="setBarOption('stacked', $event.currentTarget.checked)"
                />
                Stacked
              </label>
              <label class="chart-option">
                <input
                  type="checkbox"
                  :checked="Boolean(result.data?.timeseries)"
                  :disabled="!result.data"
                  @change="setBarOption('timeseries', $event.currentTarget.checked)"
                />
                Time series
              </label>
            </div>
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
            <BarChart
              v-else-if="result.data && activePage === 'bar'"
              :data="result.data"
              :height="canvasHeight"
              :stacked="Boolean(result.data.stacked)"
              :timeseries="Boolean(result.data.timeseries)"
              aria-label="Conversation volume by week"
            />
            <SankeyChart
              v-else-if="result.data && activePage === 'sankey'"
              :data="result.data"
              :height="canvasHeight"
              aria-label="Conversation resolution flow"
            />
            <HeatmapChart
              v-else-if="result.data && activePage === 'heatmap'"
              :data="result.data"
              aria-label="Hourly activity by day"
            />
            <div v-else class="empty-state">Fix the JSON to render the {{ activePage }} chart.</div>
          </div>
        </div>
      </section>

      <aside v-if="docsOpen" id="chart-docs" class="docs-panel" aria-label="Chart documentation">
        <div
          class="docs-resize-handle"
          role="separator"
          aria-label="Resize documentation sidebar"
          aria-orientation="vertical"
          :aria-valuemin="MIN_DOCS_WIDTH"
          :aria-valuemax="MAX_DOCS_WIDTH"
          :aria-valuenow="docsWidth"
          tabindex="0"
          @pointerdown="startDocsResize"
          @keydown.left.prevent="resizeDocsBy(20)"
          @keydown.right.prevent="resizeDocsBy(-20)"
        />
        <header class="panel-toolbar docs-toolbar">
          <p class="panel-title">{{ activeDocs.title }}</p>
          <button type="button" class="button--quiet button--small" @click="copyDocs">
            {{ docsCopied ? 'Copied' : 'Copy' }}
          </button>
        </header>
        <article class="markdown-body">
          <component :is="activeDocs.component" />
        </article>
      </aside>
    </section>
  </main>
</template>
