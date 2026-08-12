import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App.vue'
import { DEFAULT_SANKEY_DATA } from './sample-data.js'

describe('playground', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/line')
  })

  afterEach(() => vi.unstubAllGlobals())

  it('persists edited JSON in localStorage', async () => {
    const wrapper = mount(App)
    const data = JSON.stringify({ nodes: [], links: [] })

    await wrapper.get('textarea').setValue(data)

    expect(localStorage.getItem('chatwoot-viz:line-data')).toBe(data)
  })

  it('shows a useful error for invalid JSON', async () => {
    const wrapper = mount(App)

    await wrapper.get('textarea').setValue('{')

    expect(wrapper.get('#json-status').text()).toContain('Invalid JSON')
    expect(wrapper.findComponent({ name: 'LineChart' }).exists()).toBe(false)
  })

  it('keeps separate data drafts while switching between chart stories', async () => {
    const wrapper = mount(App)
    const lineData = JSON.stringify({ categories: ['One'], series: [] })

    await wrapper.get('textarea').setValue(lineData)
    await wrapper.get('a[href="/sankey"]').trigger('click')

    expect(wrapper.findComponent({ name: 'SankeyChart' }).exists()).toBe(true)
    expect(wrapper.get('textarea').element.value).toContain('conversations_handled')
    expect(window.location.pathname).toBe('/sankey')

    await wrapper.get('a[href="/line"]').trigger('click')

    expect(wrapper.findComponent({ name: 'LineChart' }).exists()).toBe(true)
    expect(wrapper.get('textarea').element.value).toBe(lineData)
    expect(window.location.pathname).toBe('/line')
  })

  it('loads the Sankey story directly from its path', () => {
    window.history.replaceState({}, '', '/sankey')

    const wrapper = mount(App)

    expect(wrapper.findComponent({ name: 'SankeyChart' }).exists()).toBe(true)
    expect(wrapper.get('a[href="/sankey"]').attributes('aria-current')).toBe('page')
    expect(wrapper.get('textarea').element.value).toBe(DEFAULT_SANKEY_DATA)
  })

  it('toggles rendered documentation for the active chart', async () => {
    const wrapper = mount(App)
    const toggle = wrapper.get('.docs-toggle')

    expect(wrapper.find('.docs-panel').exists()).toBe(false)
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('.docs-toolbar .panel-title').text()).toBe('Line Chart')
    expect(wrapper.get('.docs-panel pre code').classes()).toContain('language-json')

    await wrapper.get('a[href="/sankey"]').trigger('click')

    expect(wrapper.get('.docs-toolbar .panel-title').text()).toBe('Sankey Chart')
  })

  it('copies the active chart Markdown source', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const wrapper = mount(App)
    await wrapper.get('.docs-toggle').trigger('click')

    await wrapper.get('.docs-toolbar button').trigger('click')

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Use `LineChart`'))
    expect(wrapper.get('.docs-toolbar button').text()).toBe('Copied')
  })

  it('resizes the documentation sidebar by pointer and keyboard', async () => {
    const wrapper = mount(App)
    await wrapper.get('.docs-toggle').trigger('click')
    const handle = wrapper.get('.docs-resize-handle')

    handle.element.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 900 }),
    )
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 850 }))
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.workspace').attributes('style')).toContain('--docs-panel-width: 410px')
    expect(handle.attributes('aria-valuenow')).toBe('410')

    await handle.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.get('.workspace').attributes('style')).toContain('--docs-panel-width: 390px')
    window.dispatchEvent(new MouseEvent('pointerup'))
  })

  it('hides chart documentation controls on the home page', () => {
    window.history.replaceState({}, '', '/')

    const wrapper = mount(App)

    expect(wrapper.find('.docs-toggle').exists()).toBe(false)
    expect(wrapper.find('.docs-panel').exists()).toBe(false)
  })

  it('resets the Sankey story to its reference data', async () => {
    window.history.replaceState({}, '', '/sankey')
    const wrapper = mount(App)

    await wrapper.get('textarea').setValue('{"nodes":[],"links":[]}')
    await wrapper.findAll('.editor-actions button')[1].trigger('click')

    expect(wrapper.get('textarea').element.value).toBe(DEFAULT_SANKEY_DATA)
  })

  it('restores the resizable canvas to the available width', async () => {
    const wrapper = mount(App)
    const canvas = wrapper.get('.canvas-frame')
    canvas.element.style.width = '480px'
    canvas.element.style.height = '520px'

    await wrapper.get('.canvas-toolbar button').trigger('click')

    expect(canvas.element.style.width).toBe('100%')
    expect(canvas.element.style.height).toBe('380px')
  })

  it('updates the line layout when the canvas height changes', async () => {
    const observers = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback) {
          this.callback = callback
          observers.push(this)
        }

        observe(element) {
          this.element = element
        }

        disconnect() {}
      },
    )
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback()
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const wrapper = mount(App)
    const canvasObserver = observers.find((observer) =>
      observer.element.classList.contains('canvas-frame'),
    )
    canvasObserver.callback([{ contentRect: { height: 520, width: 800 } }])
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'LineChart' }).props('height')).toBe(520)
  })

  it('lets the line chart infer its axis from edited data', () => {
    const wrapper = mount(App)

    expect(wrapper.findComponent({ name: 'LineChart' }).props('yDomain')).toBeUndefined()
    expect(wrapper.findComponent({ name: 'LineChart' }).props('yTicks')).toBeUndefined()
  })

  it('renders both saved charts on the home page', () => {
    const savedLine = { categories: ['Saved'], series: [{ id: 'saved', data: [42] }] }
    const savedSankey = { nodes: [{ id: 'saved', count: 1 }], links: [] }
    localStorage.setItem('chatwoot-viz:line-data', JSON.stringify(savedLine))
    localStorage.setItem('chatwoot-viz:sankey-data', JSON.stringify(savedSankey))
    window.history.replaceState({}, '', '/')

    const wrapper = mount(App)

    expect(wrapper.findAll('.home-chart h2').map((heading) => heading.text())).toEqual([
      'Sankey',
      'Line',
    ])
    expect(wrapper.findComponent({ name: 'SankeyChart' }).props('data')).toEqual(savedSankey)
    expect(wrapper.findComponent({ name: 'LineChart' }).props('data')).toEqual(savedLine)
    expect(wrapper.find('.editor-panel').exists()).toBe(false)
    expect(wrapper.get('a[href="/"]').attributes('aria-current')).toBe('page')
  })

  it('falls back to default chart data when a saved home draft is invalid', () => {
    localStorage.setItem('chatwoot-viz:sankey-data', '{')
    window.history.replaceState({}, '', '/')

    const wrapper = mount(App)

    expect(wrapper.findComponent({ name: 'SankeyChart' }).props('data').nodes).toHaveLength(9)
  })
})
