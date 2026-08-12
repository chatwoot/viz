import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App.vue'

describe('playground', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('persists edited JSON in localStorage', async () => {
    const wrapper = mount(App)
    const data = JSON.stringify({ nodes: [], links: [] })

    await wrapper.get('textarea').setValue(data)

    expect(localStorage.getItem('chatwoot-viz:sankey-data')).toBe(data)
  })

  it('shows a useful error for invalid JSON', async () => {
    const wrapper = mount(App)

    await wrapper.get('textarea').setValue('{')

    expect(wrapper.get('#json-status').text()).toContain('Invalid JSON')
    expect(wrapper.findComponent({ name: 'SankeyChart' }).exists()).toBe(false)
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

  it('updates the Sankey layout when the canvas height changes', async () => {
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

    expect(wrapper.findComponent({ name: 'SankeyChart' }).props('height')).toBe(520)
  })
})
