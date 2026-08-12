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
    await wrapper.get('.story-select').setValue('sankey')

    expect(wrapper.findComponent({ name: 'SankeyChart' }).exists()).toBe(true)
    expect(wrapper.get('textarea').element.value).toContain('conversations_handled')
    expect(window.location.pathname).toBe('/sankey')

    await wrapper.get('.story-select').setValue('line')

    expect(wrapper.findComponent({ name: 'LineChart' }).exists()).toBe(true)
    expect(wrapper.get('textarea').element.value).toBe(lineData)
    expect(window.location.pathname).toBe('/line')
  })

  it('loads the Sankey story directly from its path', () => {
    window.history.replaceState({}, '', '/sankey')

    const wrapper = mount(App)

    expect(wrapper.findComponent({ name: 'SankeyChart' }).exists()).toBe(true)
    expect(wrapper.get('.story-select').element.value).toBe('sankey')
    expect(wrapper.get('textarea').element.value).toBe(DEFAULT_SANKEY_DATA)
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
})
