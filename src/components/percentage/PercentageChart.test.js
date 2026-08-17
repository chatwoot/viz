import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import PercentageChart from './PercentageChart.vue'

const creditData = {
  segments: [
    { id: 'assistant', label: 'Assistant', value: 40, color: '#4747c2' },
    { id: 'tasks', label: 'Tasks', value: 30, color: '#ab4aba' },
    { id: 'copilot', label: 'Copilot', value: 30, color: '#009688' },
  ],
  title: 'Credit usage',
}

describe('PercentageChart', () => {
  it('renders calculated segment sizes and legend percentages', () => {
    const wrapper = mount(PercentageChart, {
      props: { ariaLabel: 'Credit usage breakdown', data: creditData },
    })
    const segments = wrapper.findAll('.cw-viz-percentage__segment')

    expect(wrapper.attributes('aria-label')).toBe('Credit usage breakdown')
    expect(wrapper.get('.cw-viz-percentage__title').text()).toBe('Credit usage')
    expect(wrapper.get('.cw-viz-percentage__summary').text()).toBe('100% allocated')
    expect(segments).toHaveLength(3)
    expect(segments[0].attributes('style')).toContain('--cw-viz-percentage-segment-size: 40')
    expect(segments[0].attributes('aria-label')).toBe('Assistant: 40%')
    expect(wrapper.findAll('.cw-viz-percentage__legend strong').map((item) => item.text())).toEqual(
      ['40%', '30%', '30%'],
    )
  })

  it('calculates and renders the remainder for an explicit total', async () => {
    const wrapper = mount(PercentageChart, {
      props: {
        data: {
          segments: [
            { id: 'documents', label: 'Documents', value: 100 },
            { id: 'music', label: 'Music', value: 30 },
            { id: 'apps', label: 'Apps', value: 120 },
          ],
          title: 'Storage',
          total: 500,
        },
        formatValue: ' GB',
      },
    })

    expect(wrapper.findAll('.cw-viz-percentage__segment')).toHaveLength(4)
    expect(wrapper.get('.cw-viz-percentage__segment--remainder').attributes('style')).toContain(
      '--cw-viz-percentage-segment-size: 50',
    )
    expect(wrapper.get('.cw-viz-percentage__summary').text()).toBe('250 GB of 500 GB used')
    expect(wrapper.findAll('.cw-viz-percentage__legend li')[0].text()).toContain('100 GB')
    expect(wrapper.findAll('.cw-viz-percentage__legend li')[0].text()).not.toContain('20%')
    expect(wrapper.get('.cw-viz-percentage__legend-item--remainder').text()).toContain('250 GB')
    expect(wrapper.get('.cw-viz-percentage__legend-item--remainder').text()).not.toContain('50%')

    await wrapper.findAll('.cw-viz-percentage__segment')[0].trigger('pointerenter')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('100 GB · 20%')
  })

  it('shows a tooltip on pointer hover and keyboard focus', async () => {
    const wrapper = mount(PercentageChart, { props: { data: creditData } })
    const segment = wrapper.findAll('.cw-viz-percentage__segment')[0]

    await segment.trigger('pointerenter')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Assistant')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('40%')

    await segment.trigger('pointerleave')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)

    await segment.trigger('focus')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Assistant')

    await wrapper.setProps({ showTooltip: false })
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('can disable the tooltip and legend', () => {
    const wrapper = mount(PercentageChart, {
      props: { data: creditData, showLegend: false, showTooltip: false },
    })

    expect(wrapper.findAll('button.cw-viz-percentage__segment')).toHaveLength(0)
    expect(wrapper.findAll('span.cw-viz-percentage__segment')).toHaveLength(3)
    expect(wrapper.find('.cw-viz-percentage__legend').exists()).toBe(false)
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('calls onItemClick with calculated and original segment data', async () => {
    const onItemClick = vi.fn()
    const wrapper = mount(PercentageChart, { props: { data: creditData, onItemClick } })

    await wrapper.findAll('.cw-viz-percentage__segment')[0].trigger('click')

    expect(onItemClick).toHaveBeenCalledOnce()
    expect(onItemClick.mock.calls[0][0]).toMatchObject({
      formattedPercentage: '40%',
      formattedValue: '40',
      id: 'assistant',
      index: 0,
      isRemainder: false,
      item: creditData.segments[0],
      itemType: 'segment',
      label: 'Assistant',
      percentage: 40,
      value: 40,
    })
    expect(onItemClick.mock.calls[0][0].event).toBeInstanceOf(MouseEvent)
  })

  it('supports data accessors and configurable geometry', () => {
    const wrapper = mount(PercentageChart, {
      props: {
        barGap: 4,
        barHeight: 32,
        barRadius: 8,
        data: {
          segments: [
            { fill: '#123456', key: 'done', name: 'Done', total: 3 },
            { fill: '#654321', key: 'open', name: 'Open', total: 1 },
          ],
        },
        segmentColor: (segment) => segment.fill,
        segmentId: (segment) => segment.key,
        segmentLabel: (segment) => segment.name,
        segmentValue: (segment) => segment.total,
      },
    })

    expect(wrapper.attributes('style')).toContain('--cw-viz-percentage-bar-gap: 4px')
    expect(wrapper.attributes('style')).toContain('--cw-viz-percentage-bar-height: 32px')
    expect(wrapper.attributes('style')).toContain('--cw-viz-percentage-bar-radius: 8px')
    expect(wrapper.findAll('.cw-viz-percentage__segment')[0].attributes('style')).toContain(
      '--cw-viz-percentage-segment-color: #123456',
    )
    expect(wrapper.text()).toContain('Done')
    expect(wrapper.text()).toContain('75%')
  })

  it('keeps zero values in the legend without creating invisible controls', () => {
    const wrapper = mount(PercentageChart, {
      props: {
        data: {
          segments: [
            { id: 'empty', label: 'Empty', value: 0 },
            { id: 'full', label: 'Full', value: 10 },
          ],
        },
      },
    })

    expect(wrapper.findAll('.cw-viz-percentage__legend li')).toHaveLength(2)
    expect(wrapper.findAll('.cw-viz-percentage__segment')).toHaveLength(1)
    expect(wrapper.text()).toContain('Empty')
    expect(wrapper.text()).toContain('0%')
  })

  it('shows an error instead of rescaling values above an explicit total', () => {
    const wrapper = mount(PercentageChart, {
      props: { data: { segments: [{ value: 120 }], total: 100 } },
    })

    expect(wrapper.get('.cw-viz-percentage__empty').text()).toContain('cannot exceed the total')
    expect(wrapper.find('.cw-viz-percentage__bar').exists()).toBe(false)
  })
})
