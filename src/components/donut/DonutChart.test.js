import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import DonutChart from './DonutChart.vue'

const data = {
  segments: [
    {
      color: '#3ecf4c',
      description: 'Based on 62 responses',
      id: 'excellent',
      label: 'Excellent',
      value: 62,
    },
    { color: '#6bd36e', id: 'good', label: 'Good', value: 27 },
    { color: '#ffed55', id: 'average', label: 'Average', value: 19 },
    { color: '#ffbf2f', id: 'fair', label: 'Fair', value: 9 },
    { color: '#ffad28', id: 'poor', label: 'Poor', value: 75 },
  ],
}

describe('DonutChart', () => {
  it('renders rounded, disjoint segments and a calculated legend', () => {
    const wrapper = mount(DonutChart, {
      props: {
        ariaLabel: 'Rating distribution',
        data,
        formatPercentage: (value) => `${Number(value).toFixed(2)}%`,
      },
    })

    expect(wrapper.attributes('aria-label')).toBe('Rating distribution')
    expect(wrapper.findAll('.cw-viz-donut__segment-group')).toHaveLength(5)
    expect(wrapper.findAll('path.cw-viz-donut__segment')).toHaveLength(5)
    expect(wrapper.findAll('.cw-viz-donut__legend strong').map((item) => item.text())).toEqual([
      '32.29%',
      '14.06%',
      '9.90%',
      '4.69%',
      '39.06%',
    ])
    expect(wrapper.attributes('style')).toContain('--cw-viz-donut-corner-stroke-width: 4px')
  })

  it('shows raw values and descriptions on pointer hover and keyboard focus', async () => {
    const wrapper = mount(DonutChart, {
      props: {
        data,
        formatPercentage: (value) => `${Number(value).toFixed(2)}%`,
      },
    })
    const segment = wrapper.findAll('.cw-viz-donut__segment-group')[0]

    await segment.trigger('pointerenter')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Excellent')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('62 · 32.29%')
    expect(wrapper.get('.cw-viz-donut__tooltip-description').text()).toBe('Based on 62 responses')
    expect(segment.attributes('aria-label')).toContain('Based on 62 responses')

    await segment.trigger('pointerleave')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)

    await segment.trigger('focus')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Excellent')
  })

  it('exposes center and legend slots without adding business fields to data', () => {
    const wrapper = mount(DonutChart, {
      props: { data },
      slots: {
        center: ({ total }) => h('strong', { class: 'custom-total' }, `${total} responses`),
        'legend-item': ({ formattedValue, id, label }) =>
          h('span', { class: 'custom-legend', 'data-id': id }, `${label} (${formattedValue})`),
      },
    })

    expect(wrapper.get('.custom-total').text()).toBe('192 responses')
    expect(wrapper.findAll('.custom-legend').map((item) => item.text())).toEqual([
      'Excellent (62)',
      'Good (27)',
      'Average (19)',
      'Fair (9)',
      'Poor (75)',
    ])
  })

  it('calls onItemClick for pointer and keyboard activation', async () => {
    const onItemClick = vi.fn()
    const wrapper = mount(DonutChart, { props: { data, onItemClick } })
    const segment = wrapper.findAll('.cw-viz-donut__segment-group')[0]

    await segment.trigger('click')
    await segment.trigger('keydown', { key: 'Enter' })
    await segment.trigger('keydown', { key: ' ' })

    expect(onItemClick).toHaveBeenCalledTimes(3)
    expect(onItemClick.mock.calls[0][0]).toMatchObject({
      description: 'Based on 62 responses',
      formattedValue: '62',
      id: 'excellent',
      item: data.segments[0],
      itemType: 'segment',
      label: 'Excellent',
      value: 62,
    })
    expect(onItemClick.mock.calls[1][0].event).toBeInstanceOf(KeyboardEvent)
    expect(onItemClick.mock.calls[2][0].event).toBeInstanceOf(KeyboardEvent)
  })

  it('renders a subtle remainder and can disable tooltip and legend interactions', () => {
    const wrapper = mount(DonutChart, {
      props: {
        data: { segments: [{ id: 'used', label: 'Used', value: 20 }], total: 100 },
        showLegend: false,
        showTooltip: false,
      },
    })

    expect(wrapper.findAll('.cw-viz-donut__segment-group')).toHaveLength(2)
    expect(wrapper.get('.cw-viz-donut__segment-group--remainder').exists()).toBe(true)
    expect(wrapper.find('.cw-viz-donut__legend').exists()).toBe(false)
    expect(wrapper.find('.cw-viz-donut__segment-group[tabindex]').exists()).toBe(false)
  })

  it('shows invalid aggregate data as an error', () => {
    const wrapper = mount(DonutChart, {
      props: { data: { segments: [{ value: 120 }], total: 100 } },
    })

    expect(wrapper.get('.cw-viz-donut__empty').text()).toContain('cannot exceed the total')
    expect(wrapper.find('.cw-viz-donut__svg').exists()).toBe(false)
  })
})
