import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App.vue'

describe('playground', () => {
  beforeEach(() => {
    localStorage.clear()
  })

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
})
