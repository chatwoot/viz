import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DummyChart from './DummyChart.vue'

describe('DummyChart', () => {
  it('generates one SVG bar for each top-level JSON field', () => {
    const wrapper = mount(DummyChart, {
      props: {
        data: {
          nodes: [{ name: 'Website' }, { name: 'Inbox' }],
          links: [{ source: 0, target: 1, value: 12 }],
        },
      },
    })

    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 720 420')
    expect(wrapper.findAll('rect')).toHaveLength(2)
    expect(wrapper.text()).toContain('nodes')
    expect(wrapper.text()).toContain('links')
  })
})
